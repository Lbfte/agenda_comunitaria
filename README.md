# Agenda Comunitária

Uma aplicação focada em comunidades estudantis e acadêmicas, otimizada com foco em experiência mobile (Mobile First). Desenvolvida para que turmas, grupos e amigos possam organizar tarefas, provas, links de estudos e manter tudo sincronizado de forma ágil e dinâmica.

---

## ✨ Funcionalidades Principais

### 🎓 Gerenciamento de Turmas & Onboarding
- **Escolha de Turma no Cadastro**: Novos usuários podem selecionar sua turma acadêmica diretamente no formulário de cadastro.
- **Tela de Onboarding Inteligente**: Se o usuário logar através de login social (como Google OAuth) e não possuir uma turma associada, ele entra em um fluxo de Onboarding amigável para escolher sua turma e submeter uma solicitação de ingresso.
- **Aba Geral de Turmas**:
  - Busca instantânea e textual de turmas por nome ou código.
  - Solicitação de entrada direta com detecção e substituição automática de solicitações pendentes anteriores.
  - Possibilidade de **Sair da Turma** atual a qualquer momento.
  - **Criação de Novas Turmas**: Qualquer usuário cadastrado pode criar uma nova turma definindo um código de convite único e um nome acadêmico, tornando-se membro administrador dela.

### 📅 Calendário Acadêmico Otimizado & Sincronizado
- **Sincronização com a Turma**: O calendário do aluno reflete 100% dos compromissos acadêmicos criados para a sua turma atual de forma reativa.
- **Filtros Avançados**: Classificação visual por Categorias (Provas 🔴, Trabalhos 🟡, Atividades 🟢, Avisos 🔵) e períodos do dia.
- **Destaque do Dia Corrente**: Interface moderna com destaque no dia de hoje com base no fuso horário real.
- **Integração com Google Calendar**: Sincronização manual em lote, permitindo exportar eventos locais diretamente para a agenda do Google.

### 💬 Central Social (Chat & Notas Pessoais)
- **Chat da Turma**: Canal interativo em tempo real (`postgres_changes`) restrito a membros da turma ativa por Row-Level Security (RLS).
- **Notas Pessoais**: Bloco de notas criptografado e estritamente privado para anotações rápidas e registros pessoais.
- **Visualização Administrativa Avançada**: O Administrador Geral (`morcegosnaodormem@gmail.com`) não é forçado a se associar a uma turma pessoalmente, mantendo seu perfil limpo. No entanto, ele ganha acesso exclusivo a um dropdown de monitoramento na aba Social para ler e responder em todos os chats das turmas que ele mesmo criar.

### 👑 Painel Administrativo de Solicitações (Admin Only)
- **Aba Exclusiva de Solicitações**: Visível apenas para o administrador geral, onde ele gerencia solicitações de entrada de novos alunos pendentes em tempo real.
- **Ações Rápidas**:
  - **Aprovar**: Associa o aluno à turma no perfil e o registra em `turma_members` como membro.
  - **Rejeitar**: Exclui o pedido de solicitação permitindo ao aluno tentar novamente ou escolher outra turma.

---

## 🚀 Tecnologias e Stack
- **React 18 + Next.js 14** (App Router para roteamento híbrido robusto e melhor performance)
- **Supabase** (Banco de dados PostgreSQL, Realtime, Autenticação e Row-Level Security)
- **Tailwind CSS + Custom Vanilla CSS** (Estilizações complexas, Glassmorphism e Dark Mode nativo)
- **Framer Motion (`motion`)** (Animações fluidas e micro-interações de UX)
- **Google Calendar API** (Sincronização assíncrona com o ecossistema Google)

---

## 🏗 Arquitetura & Robustez
- **Pronto para PWA**: Arquivo de manifesto e metadados estruturados integrados ao layout nativo do Next.js.
- **Integração Fire-and-Forget**: Chamadas demoradas a serviços como Google Calendar não bloqueiam o usuário e atualizam seu estado em background silenciosamente.
- **Tratamento Resiliente**: Sessões de autenticação corrompidas ou falhas de RLS são retidas com `.catch()` limpos, sem congelar o navegador.

---

## ⚙️ Como rodar o projeto localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure suas variáveis de ambiente:**
   Copie o arquivo `.env.example` e crie um arquivo `.env` na raiz do projeto contendo as chaves públicas do Supabase. Nenhuma chave secreta do banco ou do Google Cloud Console deve ir ao repositório!
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação será iniciada em `http://localhost:3000`.

---

## 🛡️ Segurança e Contribuição
Por favor, verifique se seu `.gitignore` não está ignorando o arquivo `.env`. Jamais envie arquivos como `client_secret_*.json` ou senhas puras de banco de dados no GitHub. O banco local já está munido de RLS (Row-Level Security) pelo Supabase.

---
_Desenvolvido com 💚 para organizar mentes e comunidades._
