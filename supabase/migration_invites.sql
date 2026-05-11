-- Migration: class invitation tokens
-- Run this in the Supabase SQL Editor after the initial schema.

create table if not exists class_invites (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references classes(id) on delete cascade,
  invited_email text not null,
  invited_by    text not null,                       -- Clerk userId of the teacher
  token         text unique not null,                -- random URL-safe token
  role          text not null default 'student',     -- 'student' or 'teacher'
  accepted_at   timestamptz,
  expires_at    timestamptz not null default now() + interval '30 days',
  created_at    timestamptz not null default now()
);

create index if not exists class_invites_class_idx on class_invites(class_id);
create index if not exists class_invites_token_idx on class_invites(token);
create index if not exists class_invites_email_idx on class_invites(invited_email);

alter table class_invites enable row level security;
