-- Migration: teacher assignments
-- Run in the Supabase SQL Editor.

create table if not exists assignments (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references classes(id) on delete cascade,
  title         text not null,
  content       text not null,            -- the assignment text (parsed PDF or pasted)
  created_by    text not null,            -- Clerk userId of the teacher
  created_at    timestamptz not null default now()
);

create index if not exists assignments_class_idx on assignments(class_id);

alter table assignments enable row level security;
