/**
 * Módulo de notificações push via Notification API do browser.
 * Usado para alertas de prazo e mudanças na turma.
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Verifica se o browser suporta notificações.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Solicita permissão para notificações.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) return 'unsupported';

  const result = await Notification.requestPermission();
  return result as NotificationPermissionStatus;
}

/**
 * Retorna o status atual da permissão.
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Envia uma notificação imediata.
 */
export function sendNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: Record<string, unknown>;
  }
): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body: options?.body,
    icon: options?.icon || '/icon-192.png',
    tag: options?.tag,
    data: options?.data,
    badge: '/icon-192.png',
  });

  // Auto-fechar após 5 segundos
  setTimeout(() => notification.close(), 5000);

  // Clicar na notificação traz o foco para a janela
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Verifica tarefas com prazo próximo e envia notificações.
 * Chamado periodicamente pelo app.
 */
export function checkDeadlineAlerts(
  tasks: Array<{
    id: string;
    title: string;
    due_date: string | null;
    due_time: string | null;
    completed: boolean;
  }>
): void {
  if (typeof window === 'undefined') return;
  if (getNotificationPermission() !== 'granted') return;

  const now = new Date();
  const notifiedKey = 'agenda_turma_notified_tasks';
  const notified: string[] = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

  for (const task of tasks) {
    if (task.completed || !task.due_date || notified.includes(task.id)) continue;

    const dueStr = task.due_time
      ? `${task.due_date}T${task.due_time}`
      : `${task.due_date}T23:59:59`;

    const dueDate = new Date(dueStr);
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Alertar 24h antes
    if (diffHours > 0 && diffHours <= 24) {
      const timeLabel = diffHours < 1
        ? `${Math.round(diffHours * 60)} minutos`
        : `${Math.round(diffHours)} horas`;

      sendNotification('⏰ Prazo se aproximando!', {
        body: `"${task.title}" vence em ${timeLabel}`,
        tag: `deadline-${task.id}`,
      });

      notified.push(task.id);
    }

    // Alertar quando já passou
    if (diffHours < 0 && diffHours > -1) {
      sendNotification('🚨 Prazo expirado!', {
        body: `"${task.title}" já passou do prazo`,
        tag: `overdue-${task.id}`,
      });

      notified.push(task.id);
    }
  }

  // Manter apenas os últimos 100 IDs
  localStorage.setItem(notifiedKey, JSON.stringify(notified.slice(-100)));
}

/**
 * Notifica sobre mudanças feitas por outros membros da turma.
 */
export function notifyTurmaChange(
  userName: string,
  action: string,
  detail: string
): void {
  sendNotification('📋 Mudança na turma', {
    body: `${userName} ${action}: ${detail}`,
    tag: `turma-change-${Date.now()}`,
  });
}
