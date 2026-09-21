import { supabase } from './supabase';

export type SharedKey =
  | 'building_deletions'
  | 'buildings'
  | 'tickets'
  | 'transactions'
  | 'worker_payouts'
  | 'neighbor_services'
  | 'neighbor_requests'
  | 'custom_roles'
  | 'role_directory';

export const SHARED_KEYS: SharedKey[] = [
  'building_deletions',
  'buildings',
  'tickets',
  'transactions',
  'worker_payouts',
  'neighbor_services',
  'neighbor_requests',
  'custom_roles',
  'role_directory',
];

export function stableJson(value: unknown) {
  return JSON.stringify(value);
}

export async function fetchSharedMap(): Promise<Partial<Record<SharedKey, unknown[]>>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('app_shared').select('key, payload');
  if (error || !data) return {};
  const map: Partial<Record<SharedKey, unknown[]>> = {};
  for (const row of data as { key: SharedKey; payload: unknown }[]) {
    if (SHARED_KEYS.includes(row.key) && Array.isArray(row.payload)) {
      map[row.key] = row.payload;
    }
  }
  return map;
}

export async function saveShared(key: SharedKey, payload: unknown[]): Promise<boolean> {
  if (!supabase) return false;
  const rpc = await supabase.rpc('upsert_app_shared', { p_key: key, p_payload: payload });
  if (!rpc.error) return true;

  const upsert = await supabase.from('app_shared').upsert(
    {
      key,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
  if (upsert.error) {
    console.warn('No se pudo sincronizar', key, rpc.error.message || upsert.error.message);
    return false;
  }
  return true;
}

export function subscribeShared(
  onChange: (key: SharedKey, payload: unknown[]) => void
): () => void {
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel('app-shared-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_shared' }, (payload) => {
      const row = (payload.new || payload.old) as { key?: SharedKey; payload?: unknown } | undefined;
      if (!row?.key || !SHARED_KEYS.includes(row.key) || !Array.isArray(row.payload)) return;
      onChange(row.key, row.payload);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
