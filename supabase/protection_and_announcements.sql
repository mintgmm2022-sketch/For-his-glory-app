-- For His Glory app: Prayer Wall protection, owner reply badge and announcements (October 2026).
-- Run once in Supabase → SQL Editor. Safe to run again.

-- ---------- Settings the owner controls from the app ----------
create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null
);
alter table public.app_settings enable row level security;
drop policy if exists "read settings" on public.app_settings;
create policy "read settings" on public.app_settings for select using (true);
drop policy if exists "owner settings" on public.app_settings;
create policy "owner settings" on public.app_settings for all using (public.is_owner()) with check (public.is_owner());
insert into public.app_settings (key, value) values ('approve_first', 'false'::jsonb) on conflict (key) do nothing;

-- Words the owner wants to block (managed in the app). Only the owner can see the list.
create table if not exists public.blocked_words (
  word text primary key check (char_length(word) between 2 and 60)
);
alter table public.blocked_words enable row level security;
drop policy if exists "owner words" on public.blocked_words;
create policy "owner words" on public.blocked_words for all using (public.is_owner()) with check (public.is_owner());
insert into public.blocked_words (word) values
  ('fuck'), ('shit'), ('bitch'), ('porn'), ('casino'), ('viagra'), ('crypto'), ('bitcoin'), ('loan')
on conflict (word) do nothing;

-- ---------- "Waiting for approval" ----------
alter table public.prayers        add column if not exists pending boolean not null default false;
alter table public.comments       add column if not exists pending boolean not null default false;
alter table public.prayer_replies add column if not exists pending boolean not null default false;
alter table public.prayer_replies add column if not exists by_owner boolean not null default false;

drop policy if exists "read prayers" on public.prayers;
create policy "read prayers" on public.prayers for select using ((not hidden and not pending) or public.is_owner());
drop policy if exists "read comments" on public.comments;
create policy "read comments" on public.comments for select using ((not hidden and not pending) or public.is_owner());
drop policy if exists "read replies" on public.prayer_replies;
create policy "read replies" on public.prayer_replies for select using (
  public.is_owner() or (not hidden and not pending and exists (select 1 from public.prayers p where p.id = prayer_id and not p.hidden and not p.pending))
);
drop policy if exists "write reply" on public.prayer_replies;
create policy "write reply" on public.prayer_replies for insert with check (
  not hidden and exists (select 1 from public.prayers p where p.id = prayer_id and not p.hidden and not p.pending)
);

-- ---------- Checks on every new prayer, comment and reply ----------
-- Who posted is not stored; only a one-way fingerprint of the connection, kept for one day, to limit floods.
create table if not exists public.post_log (
  fingerprint text not null,
  created_at  timestamptz not null default now()
);
create index if not exists post_log_idx on public.post_log (fingerprint, created_at);
alter table public.post_log enable row level security;

create or replace function public.guard_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner boolean := public.is_owner();
  txt   text := lower(coalesce(new.message, '') || ' ' || coalesce(new.name, ''));
  ip    text := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', 'unknown'), ',', 1);
  fp    text := md5(ip || ':fhg');
  recent int;
  w text;
begin
  if owner then
    if tg_table_name = 'prayer_replies' then new.by_owner := true; end if;
    return new;
  end if;
  if tg_table_name = 'prayer_replies' then new.by_owner := false; end if;

  -- No links (stops most spam)
  if txt ~ '(https?://|www\.|\.com\b|\.net\b|t\.me/|bit\.ly)' then
    raise exception 'Links are not allowed here.' using errcode = 'P0001';
  end if;
  -- Blocked words
  for w in select word from public.blocked_words loop
    if position(lower(w) in txt) > 0 then
      raise exception 'Please change the wording and try again.' using errcode = 'P0001';
    end if;
  end loop;
  -- At most 5 posts every 10 minutes from the same connection
  delete from public.post_log where created_at < now() - interval '1 day';
  select count(*) into recent from public.post_log where fingerprint = fp and created_at > now() - interval '10 minutes';
  if recent >= 5 then
    raise exception 'Please wait a few minutes before posting again.' using errcode = 'P0001';
  end if;
  insert into public.post_log (fingerprint) values (fp);
  -- Approval mode
  if coalesce((select value::text = 'true' from public.app_settings where key = 'approve_first'), false) then
    new.pending := true;
  else
    new.pending := false;
  end if;
  return new;
end $$;

drop trigger if exists guard_prayers on public.prayers;
create trigger guard_prayers before insert on public.prayers for each row execute function public.guard_post();
drop trigger if exists guard_comments on public.comments;
create trigger guard_comments before insert on public.comments for each row execute function public.guard_post();
drop trigger if exists guard_replies on public.prayer_replies;
create trigger guard_replies before insert on public.prayer_replies for each row execute function public.guard_post();
revoke execute on function public.guard_post() from public, anon, authenticated;

-- ---------- Announcements (sent by the owner to everyone) ----------
create table if not exists public.announcements (
  id         bigint generated by default as identity primary key,
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null default '' check (char_length(body) <= 300),
  sent_to    int  not null default 0,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "read announcements" on public.announcements;
create policy "read announcements" on public.announcements for select using (true);
drop policy if exists "owner announcements delete" on public.announcements;
create policy "owner announcements delete" on public.announcements for delete using (public.is_owner());

do $$ begin
  alter publication supabase_realtime add table public.announcements;
exception when others then null; end $$;

-- The owner's stats now also count announcements and posts waiting for approval.
create or replace function public.pending_count() returns int
language sql stable security definer set search_path = public as $$
  select case when public.is_owner() then
    (select count(*) from public.prayers where pending)::int
    + (select count(*) from public.comments where pending)::int
    + (select count(*) from public.prayer_replies where pending)::int
  else 0 end;
$$;
grant execute on function public.pending_count() to authenticated;
