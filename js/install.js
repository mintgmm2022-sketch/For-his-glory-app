// "Add to Home Screen" helper: shown when someone opens the app link in a browser.
// Android/desktop Chrome get a one-tap Install button; iPhone gets simple picture steps;
// in-app browsers (WhatsApp, Instagram, Telegram, Facebook) are asked to open the link in the real browser.

const $ = (s) => document.querySelector(s);
const ua = navigator.userAgent;
const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /android/i.test(ua);
const inAppBrowser = /FBAN|FBAV|Instagram|Line\/|Telegram|WhatsApp|Snapchat|TikTok|; wv\)/i.test(ua);
const isSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

let deferred = null; // Chrome's install prompt, saved until the person taps Install

function snoozed() {
  try { return Number(localStorage.getItem('fhg:installLater') || 0) > Date.now(); } catch { return false; }
}
function snooze(days) {
  try { localStorage.setItem('fhg:installLater', String(Date.now() + days * 864e5)); } catch { /* storage unavailable */ }
}

function open(mode) {
  const sheet = $('#install');
  sheet.dataset.mode = mode;
  sheet.hidden = false;
  document.body.classList.add('sheet-open');
}
function close() {
  $('#install').hidden = true;
  document.body.classList.remove('sheet-open');
}

function chooseMode() {
  if (inAppBrowser) return 'inapp';
  if (deferred) return 'prompt';
  if (isIOS) return isSafari ? 'ios' : 'ios-other';
  if (isAndroid) return 'android';
  return 'desktop';
}

export function initInstall({ auto = true } = {}) {
  if (installed()) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (!$('#install').hidden) open('prompt');
    else if (auto && !snoozed()) open('prompt');
  });
  window.addEventListener('appinstalled', () => { close(); deferred = null; });

  $('#install-go').addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    if (outcome === 'accepted') close();
  });
  $('#install-later').addEventListener('click', () => { snooze(3); close(); });
  $('#install-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.origin + '/'); $('#install-copy').textContent = 'Link copied ✓'; } catch { /* ignore */ }
  });

  // Show it shortly after the app opens, so the page appears first.
  if (auto && !snoozed()) setTimeout(() => { if ($('#install').hidden) open(chooseMode()); }, 1200);
}

// For the "Install app" button on the Today screen.
export function showInstall() { open(chooseMode()); }
export const canShowInstall = () => !installed();
