// Sends today's Daily Bread as a notification to every phone that turned notifications on.
// Called by the app right after the owner publishes for today, and every morning by a schedule
// (for posts written ahead). Each post is sent only once, so extra calls do nothing.
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
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false }
    });
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? 'https://app.mintesinot.org',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    );

    const { data: today } = await db.rpc('today_local');

    // Claim today's post so it can only be sent once, even if called twice at the same moment.
    const { data: claimed, error } = await db
      .from('bread')
      .update({ notified_at: new Date().toISOString() })
      .eq('posted_on', today)
      .is('notified_at', null)
      .select('id, reference, verse_text')
      .order('id', { ascending: false })
      .limit(1);
    if (error) return json({ error: error.message }, 500);
    const post = claimed?.[0];
    if (!post) return json({ sent: 0, reason: 'nothing new to send' });

    const { data: subs } = await db.from('push_subscriptions').select('endpoint, p256dh, auth, lang');
    const text = (post.verse_text || '').replace(/\s+/g, ' ').trim();
    const short = text.length > 140 ? text.slice(0, 137) + '…' : text;

    let sent = 0;
    const gone: string[] = [];
    await Promise.all((subs ?? []).map(async (s) => {
      const payload = JSON.stringify({
        title: s.lang === 'en' ? 'Daily Bread · የዕለት እንጀራ' : 'የዕለት እንጀራ',
        body: (post.reference ? post.reference + ' · ' : '') + short,
        tag: 'bread-' + post.id,
        url: './#today'
      });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12 });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint); // phone unsubscribed or uninstalled
      }
    }));
    if (gone.length) await db.from('push_subscriptions').delete().in('endpoint', gone);

    return json({ sent, removed: gone.length, post: post.id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
