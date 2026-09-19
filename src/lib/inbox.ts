import type { PushNotification, Role } from '../types';
import { supabase } from './supabase';

type RemoteNotification = {
  id: string;
  title: string;
  message: string;
  type: PushNotification['type'];
  building_id: string | null;
  building_name: string | null;
  ticket_id: string | null;
  created_at: string;
  is_read: boolean | null;
  target_roles: string[] | null;
};

export function remoteToNotification(row: RemoteNotification): PushNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type || 'system',
    buildingId: row.building_id || undefined,
    buildingName: row.building_name || undefined,
    ticketId: row.ticket_id || undefined,
    timestamp: row.created_at,
    read: Boolean(row.is_read),
    targetRoles: (Array.isArray(row.target_roles) ? row.target_roles : ['admin']) as Role[],
  };
}

export async function fetchInbox(): Promise<PushNotification[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('app_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(80);
  if (error || !data) return [];
  return (data as RemoteNotification[]).map(remoteToNotification);
}

export async function insertInbox(notification: PushNotification) {
  if (!supabase) return;
  const { error } = await supabase.from('app_notifications').insert({
    id: notification.id.match(/^[0-9a-f-]{36}$/i) ? notification.id : undefined,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    building_id: notification.buildingId ?? null,
    building_name: notification.buildingName ?? null,
    ticket_id: notification.ticketId ?? null,
    is_read: notification.read,
    target_roles: notification.targetRoles,
  });
  if (error && error.code !== '23505') {
    console.warn('No se pudo guardar la notificación:', error.message);
  }
}

export async function markInboxRead(id: string, read = true) {
  if (!supabase) return;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await supabase.from('app_notifications').update({ is_read: read }).eq('id', id);
}

export async function markInboxReadMany(ids: string[]) {
  if (!supabase) return;
  const uuids = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!uuids.length) return;
  await supabase.from('app_notifications').update({ is_read: true }).in('id', uuids);
}
