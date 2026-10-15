// Sends an announcement from the owner to every phone with notifications on,
// and saves it so it also shows on the Today screen for 3 days. Only the owner can use it.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    // 1. Is the caller the owner? (checked with their own sign-in)
    const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false }
    });
    const { data: isOwner } = await asCaller.rpc('is_owner');
    if (isOwner !== true) return json({ error: 'Only the owner can send announcements.' }, 403);

    const { title, body } = await req.json().catch(() => ({}));
    const t = String(title ?? '').trim().slice(0, 80);
    const b = String(body ?? '').trim().slice(0, 300);
    if (!t) return json({ error: 'Please write a title.' }, 400);

    // 2. Save it and send it to everyone.
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: saved, error } = await db.from('announcements').insert({ title: t, body: b }).select('id').single();
    if (error) return json({ error: error.message }, 500);

    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? 'https://app.mintesinot.org',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    );
    const { data: subs } = await db.from('push_subscriptions').select('endpoint, p256dh, auth');
    const payload = JSON.stringify({ title: t, body: b, tag: 'news-' + saved.id, url: './#today' });
    let sent = 0;
    const gone: string[] = [];
    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint);
      }
    }));
    if (gone.length) await db.from('push_subscriptions').delete().in('endpoint', gone);
    await db.from('announcements').update({ sent_to: sent }).eq('id', saved.id);

    return json({ sent, id: saved.id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
