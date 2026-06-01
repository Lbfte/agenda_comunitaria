# 📂 Estrutura do Projeto — Agenda Comunitária

> **INSTRUÇÃO PARA IA:** Leia este arquivo **PRIMEIRO** antes de analisar qualquer código-fonte do projeto.
> Ele contém o mapa completo de responsabilidades de cada arquivo.
>
> **REGRA DE MANUTENÇÃO:** Sempre que um arquivo for **criado**, **removido** ou tiver sua **responsabilidade alterada** significativamente, você **DEVE** voltar e atualizar esta documentação antes de finalizar a tarefa.

---

## Stack & Configuração

| Tecnologia | Versão | Papel |
|---|---|---|
| Next.js | 14.2.15 | Framework principal (App Router) |
| React | 18.3.1 | Biblioteca de UI (obrigatório pelo Next.js) |
| Supabase | ^2.49.0 | Backend (PostgreSQL, Auth, Realtime, RLS) |
| Tailwind CSS | 4.1.12 | Estilização utilitária |
| Motion (Framer Motion) | 12.23.24 | Animações e micro-interações |
| Lucide React | 0.487.0 | Biblioteca de ícones SVG |
| TypeScript | ^5.5.0 | Tipagem estática |

**Admin global:** `morcegosnaodormem@gmail.com` — tem acesso exclusivo à aba de solicitações e ao monitoramento de todas as turmas.

---

## Raiz do Projeto

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | Dependências, scripts (`dev`, `build`, `start`) e metadata do projeto. |
| `next.config.mjs` | Configurações específicas do Next.js. |
| `tsconfig.json` | Configuração do TypeScript. Alias `@/` aponta para `./src/`. |
| `postcss.config.mjs` | Configuração do PostCSS para integração com o Tailwind CSS 4. |
| `next-env.d.ts` | Declarações de tipos geradas automaticamente pelo Next.js. |
| `.env` / `.env.example` | Variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `.gitignore` | Regras de exclusão do Git. Inclui `node_modules`, `.next/`, `out/`, `.env*`, e arquivos de credenciais. |
| `README.md` | Documentação pública do repositório com instruções de setup. |
| `PROJECT_STRUCTURE.md` | **Este arquivo.** Mapa de responsabilidades do projeto para economia de contexto por IAs. |

---

## /public — Arquivos Estáticos

| Arquivo | Responsabilidade |
|---|---|
| `manifest.json` | Manifesto PWA: nome, ícones, tema, orientação e categorias. Referenciado pelo `layout.tsx` via `metadata.manifest`. |
| `icon-192.svg` | Ícone SVG do app usado no manifesto PWA (192x192 e 512x512). |

---

## /src/styles — Estilos Globais

| Arquivo | Responsabilidade |
|---|---|
| `index.css` | Ponto de entrada CSS. Importa `fonts.css`, `tailwind.css` e `theme.css` (nessa ordem). Importado pelo `layout.tsx`. |
| `fonts.css` | Importa fontes do Google Fonts: **Comfortaa** (display) e **Lexend** (corpo de texto). |
| `tailwind.css` | Inicialização do Tailwind CSS 4 (`@import 'tailwindcss'`) + plugin `tw-animate-css`. |
| `theme.css` | Design tokens CSS customizados (variáveis `:root`): cores, gradientes, espaçamentos, bordas e estilos do scrollbar. Define o dark mode como padrão. |

---

## /src/lib — Utilitários e Serviços

| Arquivo | Responsabilidade |
|---|---|
| `supabase.ts` | Instância singleton do cliente Supabase (`createClient`). Lê variáveis `NEXT_PUBLIC_SUPABASE_*`. Configura auto-refresh de token, persistência de sessão e detecção de OAuth callback na URL. |
| `database.types.ts` | Tipos TypeScript gerados a partir do schema do Supabase. Define interfaces para todas as tabelas (`turmas`, `profiles`, `tasks`, `flashcards`, `flashcard_folders`, `messages`, `history`, `mentions`, `turma_members`, `turma_requests`). Exporta type helpers: `Tables<T>`, `InsertDTO<T>`, `UpdateDTO<T>` e aliases (`Task`, `Profile`, `Flashcard`, etc.). |
| `local-storage.ts` | Fila de operações offline (`OfflineOperation`) persistida no `localStorage`. Funções para adicionar, remover e processar a fila. Também gerencia um cache local genérico com TTL (`setCacheData`, `getCacheData`, `clearCache`). |
| `sync-engine.ts` | **Motor de sincronização principal.** Gerencia CRUD de tarefas com lógica online/offline. Se online → persiste no Supabase + tenta criar evento no Google Calendar (fire-and-forget) + registra no histórico. Se offline → enfileira no `localStorage`. Processa a fila automaticamente ao reconectar (`processOfflineQueue`). Inclui `syncAllWithGoogleCalendar` para sincronização em lote. |
| `google-calendar.ts` | Wrapper da Google Calendar API v3. Usa o `provider_token` da sessão OAuth do Supabase para autenticação. Funções: `createCalendarEvent`, `updateCalendarEvent`, `deleteCalendarEvent`. |
| `notifications.ts` | Módulo de notificações push via Notification API do browser. Verifica permissões, envia notificações de prazo (`checkDeadlineAlerts` — alerta 24h antes e quando expirado) e notifica mudanças na turma (`notifyTurmaChange`). |
---

## /src/app — App Router (Next.js)

### Layouts e Contextos

| Arquivo | Responsabilidade |
|---|---|
| `layout.tsx` | **Root Layout.** Define o `<html lang="pt-BR">`, carrega o CSS global (`index.css`), configura metadata SEO (título, descrição, manifesto PWA, Apple Web App), viewport e envolve tudo com `<AuthProvider>`. |
| `contexts/AuthContext.tsx` | **Provedor de autenticação global.** Gerencia estado de `user`, `profile`, `session` e `loading`. Métodos: `signInWithGoogle` (OAuth com scope do Calendar), `signInWithEmail`, `signUpWithEmail`, `signOut`, `refreshProfile`. Escuta mudanças de auth via `onAuthStateChange`. Otimiza re-renders com comparação profunda de perfil e `useMemo`. |

### Grupo `(authenticated)` — Rotas Protegidas

| Arquivo | Responsabilidade |
|---|---|
| `(authenticated)/layout.tsx` | **Layout protegido.** Verifica autenticação: se `loading` → mostra `SplashScreen`; se sem `user` → mostra `LoginPage`; se autenticado → renderiza `Sidebar` (desktop) + conteúdo + `BottomNav` (mobile). |
| `(authenticated)/page.tsx` | Rota `/` — Renderiza o componente `<Dashboard />`. |
| `(authenticated)/tasks/page.tsx` | Rota `/tasks` — Renderiza o componente `<Tasks />`. |
| `(authenticated)/social/page.tsx` | Rota `/social` — Renderiza o componente `<Social />`. |
| `(authenticated)/turmas/page.tsx` | Rota `/turmas` — Renderiza o componente `<Turmas />`. |
| `(authenticated)/history/page.tsx` | Rota `/history` — Renderiza o componente `<History />`. |
| `(authenticated)/admin/requests/page.tsx` | Rota `/admin/requests` — Renderiza o componente `<AdminRequests />`. Visível apenas para o admin global. |

### Rota Pública

| Arquivo | Responsabilidade |
|---|---|
| `auth/callback/page.tsx` | Rota `/auth/callback` — Renderiza `<AuthCallback />`. Ponto de retorno do OAuth do Supabase. |

---

## /src/app/components — Componentes React

### Navegação e Layout

| Componente | Responsabilidade |
|---|---|
| `Sidebar.tsx` | Barra lateral de navegação (visível em `md+`). Mostra logo, links de navegação com indicador ativo, avatar/nome do usuário, nome da turma e botão de logout. Adiciona link "Solicitações" se o usuário for admin. |
| `BottomNav.tsx` | Navegação inferior móvel (visível apenas em telas `< md`). Pill com 5 ícones + pill separada para notificações com badge contador. |
| `PageHeader.tsx` | Header reutilizável com logo (mobile) e toggle de abas `Pessoal`/`Geral`. Usado por `Tasks`, `StudyHub` e `History`. |
| `AppLogo.tsx` | Componente SVG do logo da aplicação (3 quadrados coloridos: amarelo, cinza e verde). Aceita prop `size`. |
| `SplashScreen.tsx` | Tela de splash animada com 3 quadrados que aparecem em sequência (400ms cada) + texto "Agenda da Turma". Auto-dismiss após 2s. |

### Autenticação

| Componente | Responsabilidade |
|---|---|
| `LoginPage.tsx` | Tela de login/cadastro. Formulário com e-mail/senha, seleção de turma no cadastro (carrega turmas do Supabase), botão Google OAuth. Salva `pending_turma_id` no `localStorage` ao cadastrar. Traduz erros comuns para PT-BR. |
| `AuthCallback.tsx` | Componente da rota `/auth/callback`. Extrai a sessão OAuth da URL via `supabase.auth.getSession()` e redireciona para `/`. Mostra spinner durante o processamento. |

### Páginas Principais

| Componente | Responsabilidade |
|---|---|
| `Dashboard.tsx` | **Página principal (Home).** Exibe calendário acadêmico (`CalendarGrid`), listagem detalhada das tarefas do dia selecionado com filtros por categoria, badge de sincronização, painel e criação de Lembretes Rápidos pessoais (usando `useTasks('pessoal')`) e botão de sincronização com Google Calendar. Usa `useTasks('geral')` para os itens principais da turma. |
| `Tasks.tsx` | **Gerenciador de tarefas completo.** Duas views: Lista com filtros avançados (busca, período, status, categoria) e **Kanban Board** cronológico. Modal de criação/edição (`TaskCreateModal`). Toggle entre `Geral` e `Pessoal`. Sincronização com Google Calendar. |
| `Social.tsx` | **Central social.** Chat em tempo real da turma (via Supabase Realtime `postgres_changes`) + notas pessoais criptografadas. Toggle entre canais `class` e `private`. Admin pode visualizar chats de todas as turmas que criou via dropdown. |
| `History.tsx` | **Histórico de atividades.** Exibe log de ações (adição, edição, deleção, conclusão) com perfil do autor, menções ao usuário e timestamps. Toggle `Geral`/`Pessoal`. |
| `Turmas.tsx` | **Gerenciamento de turmas.** Busca textual de turmas, solicitação de entrada, criação de novas turmas (com código de convite), botão de sair da turma, onboarding para usuários sem turma. |
| `AdminRequests.tsx` | **Painel administrativo.** Lista solicitações pendentes de entrada em turmas com perfil do aluno, data e turma alvo. Ações: Aprovar (atualiza perfil + insere em `turma_members` + deleta request) ou Rejeitar (deleta request). Escuta em tempo real via Realtime. |

### Componentes de Suporte

| Componente | Responsabilidade |
|---|---|
| `CalendarGrid.tsx` | Grade de calendário mensal interativo. Navegação entre meses, destaque do dia atual (sublinhado verde), seleção animada com `layoutId`, pontinhos coloridos por categoria de tarefa em cada dia. |
| `KanbanBoard.tsx` | Board Kanban cronológico para tarefas. Agrupa em colunas: Atrasadas → Datas futuras (Hoje, Amanhã, etc.) → Sem Data. Cards com indicador de prioridade lateral, badge de sync status, botões de completar/excluir. Ordenação por cor de categoria + horário. |
| `TaskCreateModal.tsx` | Modal de criação/edição de tarefas. Campos: título, descrição, data, horário, período (manhã/tarde/noite), marcador (triângulo/invertido) e cor da categoria. Exporta o tipo `TaskFormData`. |
| `SyncStatusBadge.tsx` | Badge visual de status de sincronização. Modo global: Online (verde) / Offline (vermelho) + contagem pendente (amarelo). Modo inline: badges individuais por item (`synced`/`pending`/`local`). |

---

## /src/app/hooks — Custom Hooks

| Hook | Responsabilidade |
|---|---|
| `useTasks.ts` | Hook principal de gerenciamento de tarefas. CRUD completo com **optimistic updates**, cache SWR local (30min TTL), fila offline, sincronização automática ao reconectar, abort de fetches duplicados. Aceita canal (`geral`/`pessoal`). Filtra tarefas por turma do perfil (RLS). |
| `useMessages.ts` | Hook de chat/mensagens. Fetch com cache SWR, envio otimista, cache de perfis de usuários, subscrição Realtime para mensagens nuevas (evita duplicatas), abort de fetches. Aceita canal (`class`/`private`) e `turmaId`. |
| `useHistory.ts` | Hook de histórico de atividades. Busca entradas com perfis enriquecidos, menções ao usuário com contexto, cache SWR, subscrição Realtime para novas entradas. |
| `useNetworkStatus.ts` | Hook simples de monitoramento de rede. Retorna `{ isOnline }` reativo via `navigator.onLine` + event listeners `online`/`offline`. |

---

## Grafo de Dependências Resumido

```
layout.tsx
├── AuthContext.tsx (Provider global)
│   └── supabase.ts → database.types.ts
└── (authenticated)/layout.tsx
    ├── SplashScreen.tsx
    ├── LoginPage.tsx
    ├── Sidebar.tsx
    ├── BottomNav.tsx
    └── [page].tsx → [Componente principal]
         ├── Dashboard.tsx → useTasks, CalendarGrid, SyncStatusBadge, sync-engine, notifications
         ├── Tasks.tsx → useTasks, KanbanBoard, TaskCreateModal, SyncStatusBadge, sync-engine
         ├── StudyHub.tsx → useFlashcards, FlashcardFolderModal, FlashcardEditModal, spaced-repetition
         ├── Social.tsx → useMessages
         ├── History.tsx → useHistory
         ├── Turmas.tsx → supabase (direto)
         └── AdminRequests.tsx → supabase (direto)
```

---

> _Última atualização: 01/06/2026_
