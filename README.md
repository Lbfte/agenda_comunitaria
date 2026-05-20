# Agenda Comunitária

Uma aplicação focada em comunidades estudantis e acadêmicas, operando de maneira **offline-first** e otimizada com foco em experiência mobile (Mobile First). Desenvolvida para que turmas, grupos e amigos possam organizar tarefas, provas, links de estudos e manter tudo sincronizado em nuvem sem medo de ficar sem acesso durante quedas de internet.

## 🚀 Tecnologias e Stack
- **React 18 + Vite** (Performance e carregamento rápido)
- **Supabase** (Banco de dados PostgreSQL, Autenticação e Row-Level Security)
- **Tailwind CSS + tw-animate-css** (Estilizações complexas, Glassmorphism e Dark Mode nativo)
- **Framer Motion (`motion/react`)** (Animações fluidas e micro-interações UX)
- **Google Calendar API** (Sincronização assíncrona com o ecossistema Google)

## 🏗 Arquitetura
- **Offline-First via Sync Engine**: Operações CRUD são registradas em filas locais via `localStorage`. Se a conexão cair, a interface responde imediatamente (Optimistic Updates). Assim que a rede volta, o _Sync Engine_ consome a fila e empurra as pendências para o Supabase.
- **Integração Fire-and-Forget**: Chamadas demoradas a serviços como Google Calendar não bloqueiam o usuário e atualizam seu estado em background silenciosamente.
- **Tratamento Resiliente**: Sessões de autenticação corrompidas ou falhas de RLS são retidas com `.catch()` limpos, sem congelar o navegador.

## ⚙️ Como rodar o projeto localmente

1. **Instale as dependências:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure suas variáveis de ambiente:**
   Copie o arquivo `.env.example` e crie um arquivo `.env` na raiz do projeto contendo as chaves públicas do Supabase. Nenhuma chave secreta do banco ou do Google Cloud Console deve ir ao repositório!
   \`\`\`env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   \`\`\`

3. **Inicie o servidor de desenvolvimento:**
   \`\`\`bash
   npm run dev
   \`\`\`
   A aplicação será iniciada em \`http://localhost:5173\`.

## 🛡️ Segurança e Contribuição
Por favor, verifique se seu `.gitignore` não está ignorando o arquivo `.env`. Jamais comite arquivos como `client_secret_*.json` ou senhas puras de banco de dados no Github. O banco local já está munido de RLS (Row-Level Security) pelo Supabase.

---
_Desenvolvido com 💚 para organizar mentes e comunidades._
