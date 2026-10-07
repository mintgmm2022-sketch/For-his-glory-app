import { SONGS, BREAD, COMMENTS } from './data.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, OWNER_EMAIL, OWNER_READY } from './config.js';

/* =========================================================
   Helpers
   ========================================================= */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PLAY_SVG = '<svg viewBox="0 0 16 16" class="tri" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>';
const BARS = '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>';

const store = {
  get(key, fallback) { try { const v = localStorage.getItem('fhg:' + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem('fhg:' + key, JSON.stringify(value)); } catch { /* storage unavailable */ } }
};

const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDate = (iso) => new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = (iso) => {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const fmtTime = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const youtubeId = (input) => {
  const s = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{6,20}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{6,20})/);
  return m ? m[1] : '';
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* =========================================================
   State
   ========================================================= */
const cache = store.get('cache', null);
const state = {
  songs: cache?.songs?.length ? cache.songs : SONGS,
  bread: cache?.bread?.length ? cache.bread : BREAD,
  comments: cache?.comments?.length ? cache.comments : COMMENTS,
  prayers: cache?.prayers || [],
  amened: new Set(store.get('amened', [])),
  prayed: new Set(store.get('prayed', [])),
  visits: store.get('visits', []),
  notify: store.get('notify', false),
  showWhole: new Set(),
  seg: 'prayers',
  cur: -1,          // index into visible songs
  playing: false,
  playerOpen: false,
  owner: false,
  session: null
};

const local = { prayers: store.get('localPrayers', []), comments: store.get('localComments', []) };

function saveCache() {
  store.set('cache', { songs: state.songs, bread: state.bread, comments: state.comments, prayers: state.prayers });
}
const visibleSongs = () => state.songs.filter((s) => s.is_active !== false).sort((a, b) => a.position - b.position || a.id - b.id);

/* =========================================================
   Backend (Supabase) — optional
   ========================================================= */
let db = null;
const live = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function connect() {
  if (!live) return;
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });
    const { data } = await db.auth.getSession();
    state.session = data.session;
    db.auth.onAuthStateChange((_e, session) => { state.session = session; checkOwner(); });
    await Promise.all([loadSongs(), loadBread(), loadPrayers(), loadComments(), checkOwner()]);
    subscribe();
  } catch (err) {
    console.warn('Offline or not reachable, using saved content.', err);
  }
}

async function checkOwner() {
  if (!db || !state.session) { state.owner = false; renderOwner(); renderTogether(); return; }
  const { data } = await db.rpc('is_owner');
  state.owner = data === true;
  await Promise.all([loadSongs(), loadPrayers(), loadComments()]);
  renderOwner();
}

async function loadSongs() {
  if (!db) return;
  const { data, error } = await db.from('songs').select('*').order('position').order('id');
  if (!error && data) { state.songs = data; saveCache(); renderSongs(); renderToday(); renderOwner(); }
}
async function loadBread() {
  if (!db) return;
  const { data, error } = await db.from('bread').select('*').order('posted_on', { ascending: false }).order('id', { ascending: false }).limit(60);
  if (!error && data) {
    const newest = data[0]?.id;
    const lastSeen = store.get('lastBread', null);
    if (newest && lastSeen && newest !== lastSeen && data[0].id > lastSeen) toast('New Daily Bread');
    state.bread = data; saveCache(); renderToday(); renderBread();
  }
}
async function loadPrayers() {
  if (!db) return;
  const { data, error } = await db.from('prayers').select('*').order('created_at', { ascending: false }).limit(100);
  if (!error && data) { state.prayers = data; saveCache(); renderTogether(); }
}
async function loadComments() {
  if (!db) return;
  const { data, error } = await db.from('comments').select('*').order('created_at', { ascending: false }).limit(100);
  if (!error && data) { state.comments = data; saveCache(); renderTogether(); }
}

function subscribe() {
  const debounce = (fn) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, 400); }; };
  const reload = { songs: debounce(loadSongs), bread: debounce(loadBread), prayers: debounce(loadPrayers), comments: debounce(loadComments) };
  db.channel('fhg-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, reload.songs)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bread' }, (p) => {
      reload.bread();
      if (p.eventType === 'INSERT') notifyNewBread(p.new);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'prayers' }, reload.prayers)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, reload.comments)
    .subscribe();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { reload.bread(); reload.prayers(); reload.comments(); }
  });
}

/* =========================================================
   Router
   ========================================================= */
const VIEWS = ['today', 'songs', 'bread', 'together', 'owner'];
function route() {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today';
  for (const v of VIEWS) $('#view-' + v).hidden = v !== name;
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  if (name === 'today') markVisit();
  if (name === 'bread' && state.bread[0]) store.set('lastBread', state.bread[0].id);
}

/* =========================================================
   Today
   ========================================================= */
function markVisit() {
  const today = dayKey();
  if (!state.visits.includes(today)) {
    state.visits = [...state.visits, today].slice(-60);
    store.set('visits', state.visits);
  }
  renderWeek();
}

function streak() {
  const set = new Set(state.visits);
  let n = 0;
  const d = new Date();
  while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function renderWeek() {
  const set = new Set(state.visits);
  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  $('#week').innerHTML = letters.map((l, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const k = dayKey(d);
    const cls = [set.has(k) ? 'done' : '', k === dayKey() ? 'today' : ''].join(' ');
    return `<div class="${cls}"><span>${set.has(k) ? '✓' : ''}</span>${l}</div>`;
  }).join('');
  $('#streak-count').textContent = streak();
}

function renderToday() {
  const h = new Date().getHours();
  $('#greeting').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('#today-date').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const b = state.bread[0];
  $('#today-bread').innerHTML = b ? `
    <span class="eyebrow">Daily Bread · የዕለት እንጀራ · ${esc(fmtDate(b.posted_on))}</span>
    <p class="verse">${esc(b.verse_text)}</p>
    ${b.reference ? `<div class="ref">${esc(b.reference)}</div>` : ''}
    <div class="actions">
      <button type="button" data-amen="${b.id}" aria-pressed="${state.amened.has(b.id)}">${state.amened.has(b.id) ? '♥' : '♡'} Amen · ${b.amens}</button>
      <button type="button" data-share="${b.id}">Share</button>
    </div>` : '<span class="eyebrow">Daily Bread</span><p class="verse">A new verse is coming soon.</p>';

  const songs = visibleSongs();
  const idx = songs.length ? (Math.floor(Date.now() / 86400000) % songs.length) : -1;
  const s = songs[idx];
  const btn = $('#today-song');
  btn.hidden = !s;
  if (s) {
    btn.dataset.play = s.id;
    btn.innerHTML = `
      <span class="rec-wrap" style="--size:54px" aria-hidden="true"><span class="rec spin slow"><span class="rec-label"></span></span><span class="rec-sheen"></span></span>
      <span class="grow"><span class="eth strong block-line" style="font-size:19px">${esc(s.title_am)}</span><span class="muted small block-line">${esc(s.title_en)}${s.reference ? ' · ' + esc(s.reference) : ''}</span></span>
      <span class="play-dot"><svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z"/></svg></span>`;
  }
  renderWeek();
  renderNotify();
}

/* =========================================================
   Songs
   ========================================================= */
function renderSongs() {
  const songs = visibleSongs();
  const cur = songs[state.cur];
  $('#song-list').innerHTML = songs.map((s, i) => {
    const isCur = cur && cur.id === s.id;
    return `<button type="button" class="song-row${isCur ? ' current' : ''}" data-play="${s.id}">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span class="grow"><span class="t">${esc(s.title_am)}</span><span class="s">${esc(s.title_en)}</span></span>
      ${isCur && state.playing ? BARS : PLAY_SVG}
    </button>`;
  }).join('') || '<p class="empty">Songs will appear here soon.</p>';
}

/* =========================================================
   Daily Bread
   ========================================================= */
function breadCard(b, extraClass = '', extraAttrs = '') {
  const whole = state.showWhole.has(b.id);
  const long = (b.verse_text || '').length > 220 || b.reflection || b.prayer;
  return `<article class="bread-card ${extraClass}" ${extraAttrs}>
      <div class="meta"><span>${esc(fmtDate(b.posted_on))}</span><b>${esc(b.reference)}</b></div>
      <p class="verse${whole ? '' : ' clamp'}">${esc(b.verse_text)}</p>
      ${whole && b.reflection ? `<p class="extra"><b>Reflection</b>${esc(b.reflection)}</p>` : ''}
      ${whole && b.prayer ? `<p class="extra"><b>Prayer</b>${esc(b.prayer)}</p>` : ''}
      <div class="actions">
        <button type="button" class="chip" data-amen="${b.id}" aria-pressed="${state.amened.has(b.id)}">${state.amened.has(b.id) ? '♥' : '♡'} Amen · ${b.amens}</button>
        ${long ? `<button type="button" class="chip plain" data-whole="${b.id}">${whole ? 'Show less' : 'Read all'}</button>` : ''}
        <button type="button" class="chip plain" data-share="${b.id}">Share</button>
        ${state.owner ? `<button type="button" class="chip plain danger" data-del-bread="${b.id}">Delete</button>` : ''}
      </div>
    </article>`;
}

// The newest three are listed; after that, each older verse slides up over the one before it as you scroll.
const SHOWN = 3;

// Any list longer than three: the first three are listed, the rest stack as layers while scrolling.
function stackify(items, card, label) {
  if (!items.length) return '';
  const head = items.slice(0, SHOWN).map((x) => card(x, '', '')).join('');
  const rest = items.slice(SHOWN);
  if (!rest.length) return head;
  return head + `<div class="label stack-label">${esc(label)}</div>
    <div class="stack">${rest.map((x, i) => {
      const html = card(x, ' layer', `style="--i:${i}"`);
      let out = html.includes('style="--i:') ? html : html.replace(/^(\s*<\w+)/, `$1 style="--i:${i}"`);
      const m = out.match(/<div class="msg">([\s\S]*?)<\/div>/);
      if (m && (m[1].length > 220 || m[1].split('\n').length > 5)) out = out.replace(m[0], m[0] + '<span class="more">Tap to read more</span>');
      return out;
    }).join('')}</div>`;
}

function renderBread() {
  $('#bread-list').innerHTML = stackify(state.bread, (b, layer, attrs) => breadCard(b, layer.trim(), attrs), 'Earlier verses')
    || '<p class="empty">No Daily Bread yet.</p>';
}

async function toggleAmen(id) {
  const b = state.bread.find((x) => x.id === id);
  if (!b) return;
  const on = !state.amened.has(id);
  const delta = on ? 1 : -1;
  on ? state.amened.add(id) : state.amened.delete(id);
  store.set('amened', [...state.amened]);
  b.amens = Math.max(0, b.amens + delta);
  renderToday(); renderBread();
  if (on && navigator.vibrate) navigator.vibrate(12);
  if (db) {
    const { data, error } = await db.rpc('amen', { bread_id: id, delta });
    if (!error && typeof data === 'number') { b.amens = data; renderToday(); renderBread(); }
  }
  saveCache();
}

async function shareBread(id) {
  const b = state.bread.find((x) => x.id === id);
  if (!b) return;
  const text = `${b.verse_text}\n— ${b.reference}\n\nFor His Glory · ለክብሩ`;
  try {
    if (navigator.share) await navigator.share({ title: 'Daily Bread', text, url: location.origin + location.pathname });
    else { await navigator.clipboard.writeText(text); toast('Verse copied'); }
  } catch { /* closed share sheet */ }
}

/* =========================================================
   Together: prayers and comments
   ========================================================= */
function renderTogether() {
  $('#seg-prayers').setAttribute('aria-selected', state.seg === 'prayers');
  $('#seg-comments').setAttribute('aria-selected', state.seg === 'comments');
  $('#pane-prayers').hidden = state.seg !== 'prayers';
  $('#pane-comments').hidden = state.seg !== 'comments';

  const prayers = db ? state.prayers : [...local.prayers, ...state.prayers];
  $('#prayer-list').innerHTML = stackify(prayers, (p, layer) => {
    const mine = state.prayed.has(String(p.id));
    return `<div class="post${p.hidden ? ' hidden-item' : ''}${layer}">
      <div class="msg">${esc(p.message)}</div>
      <div class="by"><span><strong>${esc(p.name || 'Anonymous')}</strong> · ${esc(fmtShort(p.created_at))}</span>
        <span>
          <button type="button" class="chip" data-pray="${p.id}" aria-pressed="${mine}">${mine ? 'Praying' : 'I prayed'}${p.prayed ? ' · ' + p.prayed : ''}</button>
          ${state.owner ? ownerTools('prayers', p) : ''}
        </span>
      </div>
    </div>`;
  }, 'Earlier prayers') || '<p class="empty">The Prayer Wall is ready for its first prayer.</p>';

  const comments = db ? state.comments : [...local.comments, ...state.comments];
  $('#comment-list').innerHTML = stackify(comments, (c, layer) => `<div class="post${c.hidden ? ' hidden-item' : ''}${layer}">
      <div class="by"><strong>${esc(c.name || 'Anonymous')}</strong><span>${esc(fmtShort(c.created_at))}</span></div>
      <div class="msg">${esc(c.message)}</div>
      ${state.owner ? `<div class="by"><span></span><span>${ownerTools('comments', c)}</span></div>` : ''}
    </div>`, 'Earlier comments') || '<p class="empty">No comments yet.</p>';
}

function ownerTools(table, row) {
  return `<button type="button" class="chip plain" data-hide="${table}:${row.id}:${row.hidden ? 0 : 1}">${row.hidden ? 'Show' : 'Hide'}</button>
          <button type="button" class="chip plain danger" data-del="${table}:${row.id}">Delete</button>`;
}

async function sharePrayer(e) {
  e.preventDefault();
  const message = $('#prayer-text').value.trim();
  if (!message) return;
  const name = $('#prayer-show-name').checked ? ($('#prayer-name').value.trim() || null) : null;
  const btn = e.submitter || e.target.querySelector('button');
  btn.disabled = true;
  if (db) {
    const { error } = await db.from('prayers').insert({ message, name });
    btn.disabled = false;
    if (error) { toast('Could not share. Please try again.'); return; }
    await loadPrayers();
  } else {
    local.prayers.unshift({ id: 'l' + Date.now(), message, name, prayed: 0, created_at: new Date().toISOString() });
    store.set('localPrayers', local.prayers);
    btn.disabled = false;
    renderTogether();
  }
  $('#prayer-text').value = '';
  toast('Your prayer is on the wall');
}

async function prayFor(id) {
  const key = String(id);
  if (state.prayed.has(key)) { toast('Thank you for praying'); return; }
  state.prayed.add(key);
  store.set('prayed', [...state.prayed]);
  const list = db ? state.prayers : [...local.prayers, ...state.prayers];
  const p = list.find((x) => String(x.id) === key);
  if (p) p.prayed = (p.prayed || 0) + 1;
  if (navigator.vibrate) navigator.vibrate(12);
  renderTogether();
  if (db && !key.startsWith('l')) {
    const { data } = await db.rpc('pray_for', { prayer_id: Number(id) });
    if (p && typeof data === 'number') { p.prayed = data; renderTogether(); }
  } else store.set('localPrayers', local.prayers);
}

async function sendComment(e) {
  e.preventDefault();
  const message = $('#comment-text').value.trim();
  if (!message) return;
  const name = $('#comment-name').value.trim() || 'Anonymous';
  store.set('myName', name === 'Anonymous' ? '' : name);
  const btn = e.submitter || e.target.querySelector('button');
  btn.disabled = true;
  if (db) {
    const { error } = await db.from('comments').insert({ message, name });
    btn.disabled = false;
    if (error) { toast('Could not send. Please try again.'); return; }
    await loadComments();
  } else {
    local.comments.unshift({ id: 'l' + Date.now(), message, name, created_at: new Date().toISOString() });
    store.set('localComments', local.comments);
    btn.disabled = false;
    renderTogether();
  }
  $('#comment-text').value = '';
  toast('Thank you for sharing');
}

/* =========================================================
   Reminder / notifications
   ========================================================= */
function renderNotify() {
  const sw = $('#notify-switch');
  const on = state.notify && 'Notification' in window && Notification.permission === 'granted';
  sw.setAttribute('aria-checked', on);
  $('#notify-status').textContent = on ? 'On · you’ll be alerted when a new verse is posted' : 'Get an alert when a new verse is posted';
}

async function toggleNotify() {
  if (!('Notification' in window)) { toast('Add the app to your Home Screen first'); return; }
  if (state.notify && Notification.permission === 'granted') { state.notify = false; }
  else {
    const perm = await Notification.requestPermission();
    state.notify = perm === 'granted';
    if (!state.notify) toast('Notifications are blocked in your phone settings');
  }
  store.set('notify', state.notify);
  renderNotify();
}

async function notifyNewBread(row) {
  if (!state.notify || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  const body = `${row.reference ? row.reference + ' · ' : ''}${(row.verse_text || '').slice(0, 120)}`;
  if (reg) reg.showNotification('New Daily Bread · የዕለት እንጀራ', { body, icon: 'icons/icon-192.png', tag: 'bread-' + row.id, data: { url: './#today' } });
}

/* =========================================================
   Player (YouTube)
   ========================================================= */
let yt = null;
let ytReady = null;
let ticker = null;

function loadYouTube() {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = resolve;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return ytReady;
}

async function playSong(id) {
  const songs = visibleSongs();
  const i = songs.findIndex((s) => String(s.id) === String(id));
  if (i < 0) return;
  const same = i === state.cur;
  state.cur = i;
  openPlayer();
  updatePlayerUI();
  renderSongs();
  await loadYouTube();
  const song = songs[i];
  if (!yt) {
    yt = new YT.Player('yt', {
      videoId: song.youtube_id,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: (e) => e.target.playVideo(),
        onStateChange: onYtState
      }
    });
  } else if (!same) {
    yt.loadVideoById(song.youtube_id);
  } else {
    yt.playVideo();
  }
}

function onYtState(e) {
  const S = YT.PlayerState;
  if (e.data === S.PLAYING) setPlaying(true);
  else if (e.data === S.PAUSED || e.data === S.CUED) setPlaying(false);
  else if (e.data === S.ENDED) { setPlaying(false); step(1); }
}

function setPlaying(on) {
  state.playing = on;
  clearInterval(ticker);
  if (on) ticker = setInterval(tick, 500);
  updatePlayerUI();
  renderSongs();
}

function tick() {
  if (!yt || !yt.getDuration) return;
  const d = yt.getDuration() || 0;
  const t = yt.getCurrentTime() || 0;
  const pct = d ? (t / d) * 100 : 0;
  $('#player-bar').style.width = pct + '%';
  $('#mini-bar').style.width = pct + '%';
  $('#t-now').textContent = fmtTime(t);
  $('#t-end').textContent = fmtTime(d);
}

function step(dir) {
  const songs = visibleSongs();
  if (!songs.length) return;
  const i = (state.cur + dir + songs.length) % songs.length;
  playSong(songs[i].id);
}

function togglePlay() {
  if (!yt || !yt.getPlayerState) { const s = visibleSongs()[state.cur]; if (s) playSong(s.id); return; }
  if (state.playing) yt.pauseVideo(); else yt.playVideo();
}

function openPlayer() {
  state.playerOpen = true;
  $('#player').hidden = false;
  $('#mini').hidden = true;
  document.body.style.overflow = 'hidden';
}

// Closing the player stops the song completely; nothing is left behind.
function closePlayer() {
  state.playerOpen = false;
  $('#player').hidden = true;
  document.body.style.overflow = '';
  if (yt && yt.stopVideo) yt.stopVideo();
  clearInterval(ticker);
  state.playing = false;
  state.cur = -1;
  closeLyricsEditor();
  $('#mini').hidden = true;
  $('#player-bar').style.width = '0%';
  $('#t-now').textContent = '0:00';
  $('#t-end').textContent = '0:00';
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
  renderSongs();
}

/* ---------- Owner: edit lyrics right in the player ---------- */
function openLyricsEditor() {
  const s = visibleSongs()[state.cur];
  if (!s || !state.owner) return;
  $('#lyrics-edit-text').value = s.lyrics || '';
  $('#lyrics-edit-verse').value = s.verse || '';
  $('#lyrics-edit').hidden = false;
  $('#player-lyrics').hidden = true;
  $('#player-verse').hidden = true;
  $('#lyrics-edit-btn').hidden = true;
  $('#lyrics-edit-text').focus();
}

function closeLyricsEditor() {
  $('#lyrics-edit').hidden = true;
  $('#player-lyrics').hidden = false;
  $('#player-verse').hidden = false;
  $('#lyrics-edit-btn').hidden = !state.owner;
}

async function saveLyrics(e) {
  e.preventDefault();
  const s = visibleSongs()[state.cur];
  if (!s || !db) return;
  const lyrics = $('#lyrics-edit-text').value.replace(/\r\n/g, '\n').trim();
  const verse = $('#lyrics-edit-verse').value.trim();
  const btn = e.submitter || e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  const { error } = await db.from('songs').update({ lyrics, verse }).eq('id', s.id);
  btn.disabled = false;
  if (error) { toast('Could not save: ' + error.message); return; }
  s.lyrics = lyrics;
  s.verse = verse;
  saveCache();
  closeLyricsEditor();
  updatePlayerUI();
  toast('Lyrics saved for everyone');
}

function updatePlayerUI() {
  const s = visibleSongs()[state.cur];
  if (!s) return;
  $('#player-title').textContent = s.title_am;
  $('#player-sub').textContent = s.title_en;
  $('#player-ref').textContent = s.reference || '';
  $('#player-verse').textContent = s.verse || '';
  $('#player-lyrics').textContent = s.lyrics || 'Lyrics will be shared soon.';
  if ($('#lyrics-edit').hidden) $('#lyrics-edit-btn').hidden = !state.owner;
  $('#player-yt').href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(s.youtube_id);
  $('#player-status').textContent = state.playing ? 'Now playing' : 'Paused';
  $('#play').setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
  $('#play-icon').innerHTML = state.playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M7 4v16l13-8z"/>';
  $('#player-rec').classList.toggle('on', state.playing);
  $('#mini-rec').classList.toggle('on', state.playing);
  $('#mini-title').textContent = s.title_am;
  $('#mini-sub').textContent = s.title_en;
  $('#mini-state').textContent = state.playing ? 'Playing' : 'Tap to play';
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: s.title_am, artist: 'Mintesinot Gebremichael', album: 'For His Glory', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
  }
}

/* =========================================================
   Owner space
   ========================================================= */
function renderOwner() {
  const box = $('#owner-body');
  if (!box) return;
  if (!live) {
    box.innerHTML = `<p class="muted">The owner tools turn on once the app is connected to its database. Follow the README in the GitHub repository to connect it.</p>`;
    return;
  }
  if (!state.session) {
    box.innerHTML = `<form class="form" id="login-form">
      <div class="lock-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>
      <p class="muted">Owner access. Enter your password to post Daily Bread, manage songs and look after the Prayer Wall.</p>
      ${OWNER_EMAIL
        ? `<input type="email" id="login-email" value="${esc(OWNER_EMAIL)}" autocomplete="username" hidden>`
        : `<label for="login-email">Email</label><input class="input" id="login-email" type="email" autocomplete="username" required>`}
      <label for="login-pass">Password</label><input class="input" id="login-pass" type="password" autocomplete="current-password" required autofocus>
      <button class="btn" type="submit">Unlock</button>
    </form>
    ${OWNER_EMAIL && !OWNER_READY ? `<details class="editor" style="margin-top:8px">
      <summary><span class="grow strong">First time? Create your password</span></summary>
      <form class="form" id="create-pass-form">
        <input type="email" value="${esc(OWNER_EMAIL)}" autocomplete="username" hidden>
        <label for="new-pass">New password (at least 8 characters)</label>
        <input class="input" id="new-pass" type="password" autocomplete="new-password" minlength="8" required>
        <label for="new-pass2">Type it again</label>
        <input class="input" id="new-pass2" type="password" autocomplete="new-password" minlength="8" required>
        <button class="btn" type="submit">Create password</button>
      </form>
    </details>` : ''}`;
    return;
  }
  if (!state.owner) {
    box.innerHTML = `<p class="muted">You’re signed in, but this account isn’t marked as the owner yet. Ask Claude to finish the owner setup, then sign out and unlock again.</p>
      <button class="btn secondary" type="button" data-signout>Sign out</button>`;
    return;
  }
  const songs = [...state.songs].sort((a, b) => a.position - b.position || a.id - b.id);
  box.innerHTML = `
    <p class="muted">Welcome, Mintesinot. Changes appear for everyone instantly.</p>

    <details class="editor" open>
      <summary><span class="grow strong">Write Daily Bread</span></summary>
      <form class="form" id="bread-form">
        <div class="two">
          <div><label for="b-date">Date</label><input class="input" id="b-date" type="date" value="${dayKey()}" required></div>
          <div><label for="b-ref">Bible reference</label><input class="input" id="b-ref" maxlength="100" placeholder="ሮሜ 1:3-4"></div>
        </div>
        <label for="b-verse">Bible verse or passage</label><textarea id="b-verse" rows="4" maxlength="6000" required></textarea>
        <label for="b-refl">Message or reflection (optional)</label><textarea id="b-refl" rows="3" maxlength="6000"></textarea>
        <label for="b-prayer">Prayer (optional)</label><textarea id="b-prayer" rows="3" maxlength="4000"></textarea>
        <button class="btn" type="submit">Publish Daily Bread</button>
      </form>
    </details>

    <div class="label" style="margin-top:14px">Songs &amp; lyrics</div>
    ${[null, ...songs].map(songEditor).join('')}

    <p class="note" style="margin-top:12px">Hide or delete prayers and comments right on the Together tab.</p>
    <button class="btn secondary" type="button" data-signout style="margin-top:8px">Sign out</button>`;
}

function songEditor(s) {
  const isNew = !s;
  s = s || { id: 'new', position: state.songs.length + 1, title_am: '', title_en: '', verse: '', reference: '', youtube_id: '', lyrics: '', is_active: true };
  return `<details class="editor"${isNew ? '' : ''}>
    <summary>
      <span class="grow"><span class="eth strong block-line">${isNew ? '＋ Add a new song' : esc(s.title_am)}</span>${isNew ? '' : `<span class="muted small block-line">${esc(s.title_en)}</span>`}</span>
      ${isNew ? '' : `<span class="badge">${s.is_active ? 'Visible' : 'Hidden'}</span>`}
    </summary>
    <form class="form" data-song-form="${s.id}">
      <label>YouTube link<input class="input" name="youtube" value="${s.youtube_id ? 'https://youtu.be/' + esc(s.youtube_id) : ''}" placeholder="https://youtu.be/…" required></label>
      <div class="two">
        <label>Amharic title<input class="input" name="title_am" lang="am" maxlength="120" value="${esc(s.title_am)}" required></label>
        <label>English title<input class="input" name="title_en" maxlength="160" value="${esc(s.title_en)}"></label>
      </div>
      <label>Verse (optional)<textarea name="verse" rows="2" maxlength="1500">${esc(s.verse)}</textarea></label>
      <div class="two">
        <label>Reference<input class="input" name="reference" maxlength="120" value="${esc(s.reference)}"></label>
        <label>Order<input class="input" name="position" type="number" min="1" max="1000" value="${s.position}"></label>
      </div>
      <label>Lyrics<textarea name="lyrics" rows="8" maxlength="20000">${esc(s.lyrics)}</textarea></label>
      <label class="check"><input type="checkbox" name="is_active"${s.is_active ? ' checked' : ''}> Show this song to listeners</label>
      <button class="btn" type="submit">${isNew ? 'Add song' : 'Save song'}</button>
    </form>
  </details>`;
}

async function signIn(e) {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({ email: $('#login-email').value.trim(), password: $('#login-pass').value });
  if (!error) return;
  if (/confirm/i.test(error.message)) toast('Almost ready. Ask Claude to finish the owner setup.');
  else toast(OWNER_EMAIL ? 'That password is not right' : 'Email or password is not right');
}

// First time only: the owner chooses a password right here in the app.
async function createOwnerPassword(e) {
  e.preventDefault();
  const p1 = $('#new-pass').value;
  const p2 = $('#new-pass2').value;
  if (p1.length < 8) { toast('Use at least 8 characters'); return; }
  if (p1 !== p2) { toast('The two passwords are not the same'); return; }
  const btn = e.submitter || e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  const { data, error } = await db.auth.signUp({ email: OWNER_EMAIL, password: p1 });
  btn.disabled = false;
  if (error) {
    toast(/registered|exists/i.test(error.message) ? 'Your password is already set. Use Unlock.' : 'Could not create: ' + error.message);
    return;
  }
  if (data.session) { toast('Password created'); return; }
  $('#owner-body').innerHTML = `<div class="lock-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>
    <p class="strong">Your password is saved.</p>
    <p class="muted">Tell Claude “password created” to finish the setup. Then come back here and tap Unlock.</p>
    <button class="btn secondary" type="button" id="back-to-unlock">Back</button>`;
  $('#back-to-unlock').addEventListener('click', renderOwner);
}

async function publishBread(e) {
  e.preventDefault();
  const row = {
    posted_on: $('#b-date').value,
    reference: $('#b-ref').value.trim(),
    verse_text: $('#b-verse').value.trim(),
    reflection: $('#b-refl').value.trim(),
    prayer: $('#b-prayer').value.trim()
  };
  const { error } = await db.from('bread').insert(row);
  if (error) { toast('Could not publish: ' + error.message); return; }
  toast('Daily Bread published');
  e.target.reset();
  $('#b-date').value = dayKey();
  loadBread();
}

async function saveSong(form) {
  const id = form.dataset.songForm;
  const f = new FormData(form);
  const vid = youtubeId(f.get('youtube'));
  if (!vid) { toast('Please paste a YouTube link'); return; }
  const row = {
    youtube_id: vid,
    title_am: String(f.get('title_am')).trim(),
    title_en: String(f.get('title_en')).trim(),
    verse: String(f.get('verse')).trim(),
    reference: String(f.get('reference')).trim(),
    position: Number(f.get('position')) || 100,
    lyrics: String(f.get('lyrics')).replace(/\r\n/g, '\n').trim(),
    is_active: f.get('is_active') === 'on'
  };
  const q = id === 'new' ? db.from('songs').insert(row) : db.from('songs').update(row).eq('id', Number(id));
  const { error } = await q;
  if (error) { toast('Could not save: ' + error.message); return; }
  toast(id === 'new' ? 'Song added' : 'Song saved');
  loadSongs();
}

async function moderate(table, id, hidden) {
  const { error } = await db.from(table).update({ hidden }).eq('id', id);
  if (error) toast('Could not update'); else (table === 'prayers' ? loadPrayers() : loadComments());
}
async function remove(table, id) {
  if (!confirm('Delete this for everyone?')) return;
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) { toast('Could not delete'); return; }
  if (table === 'prayers') loadPrayers(); else if (table === 'comments') loadComments(); else loadBread();
}

/* =========================================================
   Events
   ========================================================= */
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, [data-play]');
  if (!t) return;
  const d = t.dataset;
  if (d.play) playSong(d.play);
  else if (d.amen) toggleAmen(Number(d.amen));
  else if (d.share) shareBread(Number(d.share));
  else if (d.whole) { const id = Number(d.whole); state.showWhole.has(id) ? state.showWhole.delete(id) : state.showWhole.add(id); renderBread(); }
  else if (d.pray) prayFor(d.pray);
  else if (d.hide) { const [table, id, h] = d.hide.split(':'); moderate(table, Number(id), h === '1'); }
  else if (d.del) { const [table, id] = d.del.split(':'); remove(table, Number(id)); }
  else if (d.delBread) remove('bread', Number(d.delBread));
  else if ('signout' in d) db.auth.signOut();
});

// Tap a stacked prayer or comment to open it fully.
document.addEventListener('click', (e) => {
  const m = e.target.closest('.stack .layer .msg, .stack .layer .more');
  if (m) m.closest('.layer').classList.toggle('open');
});

document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.id === 'prayer-form') sharePrayer(e);
  else if (f.id === 'comment-form') sendComment(e);
  else if (f.id === 'login-form') signIn(e);
  else if (f.id === 'create-pass-form') createOwnerPassword(e);
  else if (f.id === 'bread-form') publishBread(e);
  else if (f.dataset.songForm) { e.preventDefault(); saveSong(f); }
});

$('#seg-prayers').addEventListener('click', () => { state.seg = 'prayers'; renderTogether(); });
$('#seg-comments').addEventListener('click', () => { state.seg = 'comments'; renderTogether(); });
$('#prayer-show-name').addEventListener('change', (e) => { $('#prayer-name').hidden = !e.target.checked; if (e.target.checked) $('#prayer-name').value ||= store.get('myName', ''); });
$('#comment-name').value = store.get('myName', '');
$('#notify-switch').addEventListener('click', toggleNotify);
// Refresh: get the newest app version and the latest posts.
$('#refresh').addEventListener('click', async () => {
  const btn = $('#refresh');
  btn.classList.add('busy');
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch { /* offline */ }
  setTimeout(() => location.reload(), 500);
});
$('#player-close').addEventListener('click', closePlayer);
$('#lyrics-edit-btn').addEventListener('click', openLyricsEditor);
$('#lyrics-edit-cancel').addEventListener('click', closeLyricsEditor);
$('#lyrics-edit').addEventListener('submit', saveLyrics);
$('#mini').addEventListener('click', () => { const s = visibleSongs()[state.cur]; if (s) playSong(s.id); });
$('#play').addEventListener('click', togglePlay);
$('#prev').addEventListener('click', () => step(-1));
$('#next').addEventListener('click', () => step(1));
window.addEventListener('hashchange', route);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.playerOpen) closePlayer(); });

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
  navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
}

/* =========================================================
   Start
   ========================================================= */
renderToday();
renderSongs();
renderBread();
renderTogether();
renderOwner();
route();
connect();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
