export const ADMIN_EMAIL = 'morcegosnaodormem@gmail.com';

export const CACHE_TTL = {
  TASKS: 30 * 60 * 1000, // 30 minutes
};

export const TASK_PERIODS = {
  manha: '☀️ Manhã',
  tarde: '⛅ Tarde',
  noite: '🌙 Noite',
} as const;

export const CATEGORY_COLORS = {
  provas: '#E85D5D',
  trabalhos: '#E8C84A',
  atividades: '#7A8F6B',
  avisos: ['#5B8DEF', '#C77DFF', '#666'],
} as const;

export const CATEGORY_FILTERS = [
  { id: 'todos', label: 'Tudo', color: 'border-zinc-700 text-zinc-300' },
  { id: 'provas', label: 'Provas 🔴', color: 'border-red-500/20 text-red-400 hover:bg-red-500/5' },
  { id: 'trabalhos', label: 'Trabalhos 🟡', color: 'border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/5' },
  { id: 'atividades', label: 'Atividades 🟢', color: 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5' },
  { id: 'avisos', label: 'Avisos 🔵', color: 'border-blue-500/20 text-blue-400 hover:bg-blue-500/5' },
] as const;

export const PERIOD_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' },
] as const;

export const USER_COLORS = ["#E85D5D", "#5B8DEF", "#E8C84A", "#7A8F6B", "#C77DFF", "#FF8C42", "#6ECFBD"];
