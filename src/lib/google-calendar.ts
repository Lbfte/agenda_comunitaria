import { supabase } from './supabase';

/**
 * Wrapper da Google Calendar API.
 * Usa o provider_token do OAuth do Supabase (que já contém o access_token do Google).
 */

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface CalendarEventInput {
  title: string;
  description?: string;
  date: string;         // 'YYYY-MM-DD'
  time?: string;        // 'HH:MM'
  durationMinutes?: number;
}

interface CalendarEventResponse {
  id: string;
  htmlLink: string;
}

/**
 * Obtém o access_token do Google via sessão Supabase.
 * O Supabase armazena o provider_token quando o login OAuth inclui scopes extras.
 */
async function getGoogleAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.provider_token ?? null;
}

/**
 * Cria um evento no Google Calendar do usuário.
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<CalendarEventResponse | null> {
  const token = await getGoogleAccessToken();
  if (!token) {
    console.warn('Google Calendar: sem access_token disponível');
    return null;
  }

  const startDateTime = input.time
    ? `${input.date}T${input.time}:00`
    : `${input.date}T09:00:00`;

  const duration = input.durationMinutes || 60;
  const endDate = new Date(startDateTime);
  endDate.setMinutes(endDate.getMinutes() + duration);
  const endDateTime = endDate.toISOString().slice(0, 19);

  const event = {
    summary: input.title,
    description: input.description || '',
    start: input.time
      ? { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
      : { date: input.date },
    end: input.time
      ? { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
      : { date: input.date },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Google Calendar API erro:', res.status, err);
      return null;
    }

    const data = await res.json();
    return { id: data.id, htmlLink: data.htmlLink };
  } catch (e) {
    console.error('Google Calendar API erro de rede:', e);
    return null;
  }
}

/**
 * Atualiza um evento existente no Google Calendar.
 */
export async function updateCalendarEvent(
  eventId: string,
  input: Partial<CalendarEventInput>
): Promise<boolean> {
  const token = await getGoogleAccessToken();
  if (!token) return false;

  const patch: Record<string, unknown> = {};
  if (input.title) patch.summary = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.date) {
    if (input.time) {
      const startDateTime = `${input.date}T${input.time}:00`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      patch.start = { dateTime: startDateTime, timeZone: tz };
      const endDate = new Date(startDateTime);
      endDate.setMinutes(endDate.getMinutes() + (input.durationMinutes || 60));
      patch.end = { dateTime: endDate.toISOString().slice(0, 19), timeZone: tz };
    } else {
      patch.start = { date: input.date };
      patch.end = { date: input.date };
    }
  }

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Deleta um evento do Google Calendar.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const token = await getGoogleAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok || res.status === 404; // 404 = já deletado, ok
  } catch {
    return false;
  }
}
