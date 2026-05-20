-- ============================================================
-- Agenda da Turma — Supabase Schema
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- ============================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. TURMAS (Classes)
-- ────────────────────────────────────────────────────────────
create table public.turmas (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  code          text unique not null,           -- código de convite (ex: "CC2026-A")
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. PROFILES (extensão de auth.users)
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  initials      text generated always as (
    upper(
      coalesce(
        left(split_part(full_name, ' ', 1), 1) ||
        left(split_part(full_name, ' ', 2), 1),
        left(full_name, 2)
      )
    )
  ) stored,
  turma_id      uuid references public.turmas(id) on delete set null,
  color         text default '#7A8F6B',         -- cor do avatar
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Trigger: criar perfil automaticamente quando um usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 3. TURMA_MEMBERS (membros da turma)
-- ────────────────────────────────────────────────────────────
create table public.turma_members (
  turma_id      uuid not null references public.turmas(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'member' check (role in ('admin', 'member')),
  joined_at     timestamptz default now(),
  primary key (turma_id, user_id)
);

-- ────────────────────────────────────────────────────────────
-- 4. TASKS (Tarefas / Eventos)
-- ────────────────────────────────────────────────────────────
create table public.tasks (
  id                      uuid primary key default uuid_generate_v4(),
  title                   text not null,
  description             text,
  type                    text not null check (type in ('turma', 'pessoal')),  -- IMUTÁVEL pós-criação
  turma_id                uuid references public.turmas(id) on delete cascade,
  created_by              uuid not null references auth.users(id) on delete cascade,
  due_date                date,
  due_time                time,
  period                  text check (period in ('manha', 'tarde', 'noite')),
  shape                   text default 'triangle' check (shape in ('triangle', 'invTriangle')),
  shape_color             text default '#666',
  completed               boolean default false,
  completed_at            timestamptz,
  google_calendar_event_id text,                 -- ID do evento no Google Calendar
  sync_status             text default 'pending' check (sync_status in ('synced', 'pending', 'local')),
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Impedir alteração do campo "type" após criação
create or replace function public.prevent_type_change()
returns trigger
language plpgsql
as $$
begin
  if old.type is distinct from new.type then
    raise exception 'O tipo da tarefa não pode ser alterado após a criação.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_prevent_type_change
  before update on public.tasks
  for each row execute function public.prevent_type_change();

-- ────────────────────────────────────────────────────────────
-- 5. FLASHCARD_FOLDERS (Pastas de Flashcards)
-- ────────────────────────────────────────────────────────────
create table public.flashcard_folders (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  letter        text,                            -- letra exibida no card (ex: "B" para Biologia)
  color         text default '#454545',
  type          text not null check (type in ('turma', 'pessoal')),
  turma_id      uuid references public.turmas(id) on delete cascade,
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 6. FLASHCARDS
-- ────────────────────────────────────────────────────────────
create table public.flashcards (
  id              uuid primary key default uuid_generate_v4(),
  folder_id       uuid not null references public.flashcard_folders(id) on delete cascade,
  question        text not null,
  answer          text not null,
  created_by      uuid not null references auth.users(id) on delete cascade,
  -- Campos de Repetição Espaçada (algoritmo SM-2)
  next_review_at  timestamptz default now(),
  interval_days   real default 1,                -- intervalo atual em dias
  ease_factor     real default 2.5,              -- fator de facilidade (SM-2 default)
  repetitions     integer default 0,             -- quantas vezes foi revisado
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 7. MESSAGES (Chat da turma e notas pessoais)
-- ────────────────────────────────────────────────────────────
create table public.messages (
  id            uuid primary key default uuid_generate_v4(),
  turma_id      uuid references public.turmas(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  channel       text not null check (channel in ('class', 'private')),
  text          text not null,
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 8. HISTORY (Registro cronológico de ações)
-- ────────────────────────────────────────────────────────────
create table public.history (
  id            uuid primary key default uuid_generate_v4(),
  turma_id      uuid references public.turmas(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  action        text not null check (action in ('add', 'edit', 'delete', 'complete')),
  entity_type   text not null check (entity_type in ('task', 'flashcard', 'folder', 'message', 'turma')),
  entity_id     uuid,
  description   text,                            -- ex: "add em 20/03 - Prova"
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 9. MENTIONS (Menções em ações do histórico)
-- ────────────────────────────────────────────────────────────
create table public.mentions (
  id                uuid primary key default uuid_generate_v4(),
  history_id        uuid not null references public.history(id) on delete cascade,
  mentioned_user_id uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES para performance
-- ────────────────────────────────────────────────────────────
create index idx_tasks_turma        on public.tasks(turma_id);
create index idx_tasks_created_by   on public.tasks(created_by);
create index idx_tasks_due_date     on public.tasks(due_date);
create index idx_tasks_sync_status  on public.tasks(sync_status) where sync_status = 'pending';
create index idx_flashcards_folder  on public.flashcards(folder_id);
create index idx_flashcards_review  on public.flashcards(next_review_at);
create index idx_messages_turma     on public.messages(turma_id, channel, created_at desc);
create index idx_history_turma      on public.history(turma_id, created_at desc);
create index idx_mentions_user      on public.mentions(mentioned_user_id);
create index idx_turma_members_user on public.turma_members(user_id);

-- ────────────────────────────────────────────────────────────
-- 10. TURMA_REQUESTS (Solicitações para entrar na turma)
-- ────────────────────────────────────────────────────────────
create table public.turma_requests (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  turma_id      uuid not null references public.turmas(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz default now(),
  unique (user_id, turma_id)
);

create index idx_turma_requests_user on public.turma_requests(user_id);

