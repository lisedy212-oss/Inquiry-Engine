-- ═══════════════════════════════════════════════════════════════════
-- Inquiry Engine — Database Schema
-- Run this in the Supabase SQL Editor on a fresh project.
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Classes ───────────────────────────────────────────────────────
create table if not exists classes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  teacher_code  text unique not null,
  name          text not null,
  owner_id      text not null,           -- Clerk userId of the creator
  created_at    timestamptz not null default now()
);

create index if not exists classes_owner_idx on classes(owner_id);
create index if not exists classes_code_idx on classes(code);
create index if not exists classes_teacher_code_idx on classes(teacher_code);

-- ─── Teachers per class (many-to-many) ─────────────────────────────
create table if not exists class_teachers (
  class_id      uuid not null references classes(id) on delete cascade,
  teacher_id    text not null,            -- Clerk userId
  teacher_name  text not null,
  joined_at     timestamptz not null default now(),
  primary key (class_id, teacher_id)
);

create index if not exists class_teachers_teacher_idx on class_teachers(teacher_id);

-- ─── Students per class (many-to-many) ─────────────────────────────
create table if not exists class_students (
  class_id      uuid not null references classes(id) on delete cascade,
  student_id    text not null,            -- Clerk userId, or mock-XXXX for seeded demo data
  display_name  text not null,
  avatar        text not null,
  is_mock       boolean not null default false,
  joined_at     timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index if not exists class_students_student_idx on class_students(student_id);
create index if not exists class_students_class_idx on class_students(class_id);

-- ─── Learning DNA Snapshots ────────────────────────────────────────
create table if not exists snapshots (
  id                     uuid primary key default gen_random_uuid(),
  student_id             text not null,   -- Clerk userId or mock-XXXX
  class_id               uuid references classes(id) on delete set null,
  created_at             timestamptz not null default now(),

  -- analysis payload
  concepts               jsonb not null default '[]'::jsonb,
  misconceptions         jsonb not null default '[]'::jsonb,
  hint_count             int  not null default 0,
  aha_moment             text,
  question_depth         text not null default 'surface',
  engagement_quality     int  not null default 5,
  growth_signals         jsonb not null default '[]'::jsonb,
  summary                text not null default '',

  detected_subject       text,
  subject_mismatch       boolean not null default false,
  valid_for_analytics    boolean not null default true
);

create index if not exists snapshots_student_idx on snapshots(student_id);
create index if not exists snapshots_class_idx on snapshots(class_id);
create index if not exists snapshots_student_created_idx on snapshots(student_id, created_at desc);

-- ─── Teacher private notes ─────────────────────────────────────────
create table if not exists teacher_notes (
  teacher_id    text not null,            -- Clerk userId
  student_id    text not null,
  note          text not null default '',
  updated_at    timestamptz not null default now(),
  primary key (teacher_id, student_id)
);

create index if not exists teacher_notes_student_idx on teacher_notes(student_id);

-- ─── Daily quota tracking (free tier limit) ────────────────────────
create table if not exists daily_quota (
  user_id   text not null,
  day       date not null,
  count     int not null default 0,
  primary key (user_id, day)
);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security: ALL tables protected. The app talks to Supabase
-- via the SERVICE ROLE KEY from server-side API routes only — never
-- directly from the browser. The browser uses our /api/* routes which
-- authenticate via Clerk and authorize via app logic.
-- ═══════════════════════════════════════════════════════════════════

alter table classes        enable row level security;
alter table class_teachers enable row level security;
alter table class_students enable row level security;
alter table snapshots      enable row level security;
alter table teacher_notes  enable row level security;
alter table daily_quota    enable row level security;

-- (No policies needed — the service role bypasses RLS.
--  We deliberately keep all reads/writes server-side to authorize via Clerk.)
