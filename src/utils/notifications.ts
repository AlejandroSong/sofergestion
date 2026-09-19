import { PushNotification, User } from '../types';

const readKey = (email: string) => `gest_v2_notif_read_${email.trim().toLowerCase()}`;

export function loadReadNotificationIds(email: string): string[] {
  if (!email) return [];
  try {
    const raw = localStorage.getItem(readKey(email));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveReadNotificationIds(email: string, ids: string[]) {
  if (!email) return;
  localStorage.setItem(readKey(email), JSON.stringify([...new Set(ids)].slice(0, 400)));
}

export function isNotificationForUser(n: PushNotification, user: User): boolean {
  const roles = n.targetRoles?.length ? n.targetRoles : ['admin'];
  if (!roles.includes(user.role)) return false;
  if (user.role === 'admin' || user.role === 'worker') return true;
  if ((user.role === 'president' || user.role === 'neighbor') && n.buildingId) {
    return n.buildingId === user.buildingId;
  }
  return true;
}

export function withLocalReads(items: PushNotification[], readIds: string[]): PushNotification[] {
  const known = new Set(readIds);
  return items
    .map((n) => ({ ...n, read: Boolean(n.read || known.has(n.id)) }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function mergeNotificationLists(
  local: PushNotification[],
  remote: PushNotification[],
  readIds: string[]
): PushNotification[] {
  const byId = new Map<string, PushNotification>();
  [...remote, ...local].forEach((n) => {
    const prev = byId.get(n.id);
    byId.set(n.id, {
      ...(prev || n),
      ...n,
      read: Boolean(prev?.read || n.read || readIds.includes(n.id)),
    });
  });
  return withLocalReads([...byId.values()], readIds);
}
