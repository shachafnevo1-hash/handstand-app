-- HandstandHub initial schema
-- Run in Supabase SQL editor (Dashboard → SQL → New query)
-- or via CLI: supabase db push

-- ──────────────────────────────────────────────────────────────────────────────
-- USERS (mirrors auth.users with app-level fields)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  last_login    timestamptz
);

alter table public.users enable row level security;

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────────────────────
-- USER PROGRESS
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_progress (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  current_level            int  not null default 1,
  xp                       int  not null default 0,
  total_xp                 int  not null default 0,
  completed_levels         int[]  not null default '{}',
  streak_count             int  not null default 0,
  longest_streak           int  not null default 0,
  last_active_date         text,
  daily_challenge_completed boolean not null default false,
  daily_challenge_date     text,
  join_date                timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique(user_id)
);

alter table public.user_progress enable row level security;

create policy "Users can manage their own progress"
  on public.user_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- TRAINING SESSIONS
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.training_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  local_id             text,                    -- the Date.now() id from local storage
  session_date         timestamptz not null default now(),
  level_id             int,
  exercise_name        text,
  duration_seconds     int,
  ai_detected          boolean,
  ai_type              text,
  ai_confidence        text,
  form_feedback        text[],                  -- array of coaching cue strings
  star_rating          int,
  form_score           int,
  video_uri            text,
  status               text not null default 'pending',
  created_at           timestamptz not null default now()
);

alter table public.training_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.training_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists training_sessions_user_date
  on public.training_sessions(user_id, session_date desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- USER SETTINGS
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_settings (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  notif_enabled        boolean not null default false,
  notif_reminder_hour  int     not null default 8,
  notif_reminder_min   int     not null default 0,
  notif_streak         boolean not null default true,
  notif_weekly         boolean not null default true,
  training_days        int[]   not null default '{1,3,5}',  -- Mon=0..Sun=6 indices
  weekly_plan_start    text,                                -- ISO date YYYY-MM-DD
  weekly_plan_offset   int     not null default 0,
  updated_at           timestamptz not null default now(),
  unique(user_id)
);

alter table public.user_settings enable row level security;

create policy "Users can manage their own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- TRIGGER: auto-create profile row on signup
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now()
  );
  insert into public.user_progress (user_id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET for avatar images
-- ──────────────────────────────────────────────────────────────────────────────
-- Run this separately in the Supabase Dashboard → Storage
-- or via CLI after the migration:
--
--   supabase storage create avatars --public
--
-- Then add RLS policies via dashboard:
--   INSERT: (auth.uid())::text = (storage.foldername(name))[1]
--   SELECT: bucket_id = 'avatars'  (public read)
