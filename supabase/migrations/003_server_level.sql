-- HandstandHub: server-side level recompute
-- Mirrors assignLevel() in App.js so the server overwrites any client-tampered current_level.

-- 1. Store quiz answers on the progress row
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS quiz_answers jsonb;

-- 2. SQL mirror of assignLevel(answers) — answers[0]=q1, [1]=q2, [2]=q3
create or replace function public.compute_level_from_answers(answers jsonb)
returns int
language plpgsql
immutable
as $$
declare
  q1 text := answers->0 #>> '{}';
  q2 text := answers->1 #>> '{}';
  q3 text := answers->2 #>> '{}';
begin
  if q1 = 'No' or q2 = '0 seconds'                              then return 1; end if;
  if q2 = '5-15 seconds'  and q3 = 'Never'                      then return 2; end if;
  if q3 = 'A second or two'                                      then return 3; end if;
  if q3 = '5+ seconds'    and q2 = '15-30 seconds'              then return 4; end if;
  if q3 = '5+ seconds'    and q2 = '30+ seconds'                then return 5; end if;
  -- fallback by wall hold
  if q2 = '5-15 seconds'                                        then return 2; end if;
  if q2 = '15-30 seconds'                                       then return 3; end if;
  return 2;
end;
$$;

-- 3. Trigger: overwrite current_level whenever quiz_answers is present
create or replace function public.enforce_server_level()
returns trigger
language plpgsql
as $$
begin
  if new.quiz_answers is not null then
    new.current_level := public.compute_level_from_answers(new.quiz_answers);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_server_level on public.user_progress;
create trigger trg_enforce_server_level
  before insert or update on public.user_progress
  for each row execute procedure public.enforce_server_level();

-- ─── Verification query (run after migration) ───────────────────────────────
-- Should return level=1 despite current_level=5 being passed:
--
-- insert into public.user_progress (user_id, current_level, quiz_answers)
-- values ('00000000-0000-0000-0000-000000000001', 5, '["No","0 seconds","Never"]'::jsonb)
-- on conflict (user_id) do update set current_level=excluded.current_level, quiz_answers=excluded.quiz_answers
-- returning current_level;  -- expect: 1
