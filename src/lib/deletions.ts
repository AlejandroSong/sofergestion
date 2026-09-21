export const DELETION_SCOPES = [
  'buildings',
  'tickets',
  'transactions',
  'worker_payouts',
  'neighbor_services',
  'neighbor_requests',
  'custom_roles',
] as const;

export type DeletionScope = (typeof DELETION_SCOPES)[number];

export type DeletionRow = {
  scope: DeletionScope;
  id: string;
};

const STORAGE_KEY = 'gest_v2_record_deletions';
const BUILDINGS_KEY = 'gest_v2_deleted_buildings';

export function deletionKey(scope: DeletionScope, id: string) {
  return `${scope}:${id}`;
}

function isScope(value: string): value is DeletionScope {
  return (DELETION_SCOPES as readonly string[]).includes(value);
}

function parseStored(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function loadDeletionKeys(): Set<string> {
  const keys = new Set(parseStored(localStorage.getItem(STORAGE_KEY)));
  parseStored(localStorage.getItem(BUILDINGS_KEY)).forEach((id) => keys.add(deletionKey('buildings', id)));
  return keys;
}

export function saveDeletionKeys(keys: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
  const buildingIds = [...keys]
    .filter((key) => key.startsWith('buildings:'))
    .map((key) => key.slice('buildings:'.length));
  localStorage.setItem(BUILDINGS_KEY, JSON.stringify(buildingIds));
}

export function rowsFromKeys(keys: Set<string>): DeletionRow[] {
  const rows: DeletionRow[] = [];
  keys.forEach((key) => {
    const sep = key.indexOf(':');
    if (sep <= 0) return;
    const scope = key.slice(0, sep);
    const id = key.slice(sep + 1);
    if (isScope(scope) && id) rows.push({ scope, id });
  });
  return rows;
}

export function applyDeletionRows(keys: Set<string>, rows: Array<{ scope?: string; id?: string }>) {
  rows.forEach((row) => {
    if (!row?.id || !row.scope || !isScope(row.scope)) return;
    keys.add(deletionKey(row.scope, row.id));
  });
  return keys;
}

export function dropDeleted<T extends { id: string }>(scope: DeletionScope, list: T[], keys: Set<string>) {
  return list.filter((item) => !keys.has(deletionKey(scope, item.id)));
}

export function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  local.forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  remote.forEach((item) => {
    if (!item?.id) return;
    const prev = map.get(item.id);
    map.set(item.id, prev ? { ...prev, ...item } : item);
  });
  return [...map.values()];
}
