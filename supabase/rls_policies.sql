-- ============================================================
-- Agenda da Turma — Row Level Security (RLS) Policies
-- Execute APÓS o schema.sql no SQL Editor do Supabase
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table public.turmas           enable row level security;
alter table public.profiles         enable row level security;
alter table public.turma_members    enable row level security;
alter table public.tasks            enable row level security;
alter table public.flashcard_folders enable row level security;
alter table public.flashcards       enable row level security;
alter table public.messages         enable row level security;
alter table public.history          enable row level security;
alter table public.mentions         enable row level security;

-- ════════════════════════════════════════════════════════════
-- Helper: verifica se o usuário autenticado é membro de uma turma
-- ════════════════════════════════════════════════════════════
create or replace function public.is_turma_member(p_turma_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.turma_members
    where turma_id = p_turma_id and user_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────
-- Ler: usuários podem ver perfis de membros da sua turma
create policy "profiles_select_same_turma" on public.profiles
  for select using (
    turma_id is null
    or public.is_turma_member(turma_id)
    or id = auth.uid()
  );

-- Atualizar: apenas o próprio perfil
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- TURMAS
-- ────────────────────────────────────────────────────────────
-- Ler: apenas membros da turma
create policy "turmas_select_members" on public.turmas
  for select using (public.is_turma_member(id));

-- Criar: qualquer usuário autenticado
create policy "turmas_insert_auth" on public.turmas
  for insert with check (auth.uid() = created_by);

-- Atualizar: apenas o criador
create policy "turmas_update_owner" on public.turmas
  for update using (created_by = auth.uid());

-- ────────────────────────────────────────────────────────────
-- TURMA_MEMBERS
-- ────────────────────────────────────────────────────────────
-- Ler: membros da turma veem os outros membros
create policy "turma_members_select" on public.turma_members
  for select using (public.is_turma_member(turma_id));

-- Inserir: o próprio usuário pode entrar (via código de convite)
create policy "turma_members_insert" on public.turma_members
  for insert with check (user_id = auth.uid());

-- Deletar: sair da turma (apenas a si mesmo) ou admin remove membros
create policy "turma_members_delete" on public.turma_members
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.turma_members
      where turma_id = turma_members.turma_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- TASKS
-- ────────────────────────────────────────────────────────────
-- Ler: tarefas de turma → membros da turma. Tarefas pessoais → apenas o criador
create policy "tasks_select" on public.tasks
  for select using (
    case
      when type = 'turma' then public.is_turma_member(turma_id)
      when type = 'pessoal' then created_by = auth.uid()
      else false
    end
  );

-- Criar: autenticado. Se turma → deve ser membro
create policy "tasks_insert" on public.tasks
  for insert with check (
    created_by = auth.uid()
    and (
      (type = 'pessoal')
      or (type = 'turma' and public.is_turma_member(turma_id))
    )
  );

-- Atualizar: turma → membros da turma. Pessoal → apenas criador
create policy "tasks_update" on public.tasks
  for update using (
    case
      when type = 'turma' then public.is_turma_member(turma_id)
      when type = 'pessoal' then created_by = auth.uid()
      else false
    end
  );

-- Deletar: apenas o criador
create policy "tasks_delete" on public.tasks
  for delete using (created_by = auth.uid());

-- ────────────────────────────────────────────────────────────
-- FLASHCARD_FOLDERS
-- ────────────────────────────────────────────────────────────
create policy "folders_select" on public.flashcard_folders
  for select using (
    case
      when type = 'turma' then public.is_turma_member(turma_id)
      when type = 'pessoal' then created_by = auth.uid()
      else false
    end
  );

create policy "folders_insert" on public.flashcard_folders
  for insert with check (
    created_by = auth.uid()
    and (
      (type = 'pessoal')
      or (type = 'turma' and public.is_turma_member(turma_id))
    )
  );

create policy "folders_update" on public.flashcard_folders
  for update using (created_by = auth.uid());

create policy "folders_delete" on public.flashcard_folders
  for delete using (created_by = auth.uid());

-- ────────────────────────────────────────────────────────────
-- FLASHCARDS
-- ────────────────────────────────────────────────────────────
-- Herda visibilidade da pasta
create policy "flashcards_select" on public.flashcards
  for select using (
    exists (
      select 1 from public.flashcard_folders f
      where f.id = folder_id
        and (
          (f.type = 'turma' and public.is_turma_member(f.turma_id))
          or (f.type = 'pessoal' and f.created_by = auth.uid())
        )
    )
  );

create policy "flashcards_insert" on public.flashcards
  for insert with check (created_by = auth.uid());

create policy "flashcards_update" on public.flashcards
  for update using (created_by = auth.uid());

create policy "flashcards_delete" on public.flashcards
  for delete using (created_by = auth.uid());

-- ────────────────────────────────────────────────────────────
-- MESSAGES
-- ────────────────────────────────────────────────────────────
-- Mensagens da turma: membros leem. Privadas: apenas o autor
create policy "messages_select" on public.messages
  for select using (
    case
      when channel = 'class' then public.is_turma_member(turma_id)
      when channel = 'private' then user_id = auth.uid()
      else false
    end
  );

create policy "messages_insert" on public.messages
  for insert with check (
    user_id = auth.uid()
    and (
      (channel = 'private')
      or (channel = 'class' and public.is_turma_member(turma_id))
    )
  );

-- ────────────────────────────────────────────────────────────
-- HISTORY
-- ────────────────────────────────────────────────────────────
-- Visível para membros da turma
create policy "history_select" on public.history
  for select using (public.is_turma_member(turma_id));

create policy "history_insert" on public.history
  for insert with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- MENTIONS
-- ────────────────────────────────────────────────────────────
-- Visível para o mencionado e membros da turma do histórico
create policy "mentions_select" on public.mentions
  for select using (
    mentioned_user_id = auth.uid()
    or exists (
      select 1 from public.history h
      where h.id = history_id
        and public.is_turma_member(h.turma_id)
    )
  );

create policy "mentions_insert" on public.mentions
  for insert with check (
    exists (
      select 1 from public.history h
      where h.id = history_id and h.user_id = auth.uid()
    )
  );
