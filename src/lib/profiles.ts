import type { User } from '../types';
import { ADMIN_USER, isPrimaryAdmin } from '../data/users';
import { supabase } from './supabase';

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  phone: string | null;
  role: User['role'];
  building_id: string | null;
  building_name: string | null;
  specialty: string | null;
  unit_or_area: string | null;
  provider: User['provider'] | null;
  status: User['status'] | null;
  monthly_fee?: number | null;
  fee_balance?: number | null;
  fee_frequency?: User['feeFrequency'] | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function profileToUser(row: ProfileRow): User {
  const email = (row.email || '').trim();
  const isAdmin = email.toLowerCase() === ADMIN_USER.email.toLowerCase();
  return {
    id: isAdmin ? ADMIN_USER.id : row.id,
    name: row.name || email.split('@')[0],
    email,
    role: isAdmin ? 'admin' : row.role || 'unassigned',
    avatar: row.avatar || ADMIN_USER.avatar,
    phone: row.phone || '+34 600 000 000',
    buildingId: row.building_id || undefined,
    buildingName: row.building_name || undefined,
    specialty: row.specialty || undefined,
    unitOrArea: row.unit_or_area || undefined,
    provider: row.provider || 'google',
    status: row.status || 'active',
    monthlyFee: row.monthly_fee ?? undefined,
    feeBalance: row.fee_balance ?? undefined,
    feeFrequency: row.fee_frequency || undefined,
  };
}

function corePayload(user: User, authUserId: string) {
  return {
    id: authUserId,
    email: user.email.trim().toLowerCase(),
    name: user.name,
    avatar: user.avatar,
    phone: user.phone || null,
    provider: user.provider || 'google',
    status: user.status || 'active',
  };
}

export async function upsertProfile(user: User, authUserId: string) {
  if (!supabase || !isUuid(authUserId)) return;

  const isAdmin = user.email.trim().toLowerCase() === ADMIN_USER.email.toLowerCase();
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', authUserId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from('profiles').insert({
      ...corePayload(user, authUserId),
      role: isAdmin ? 'admin' : 'unassigned',
    });
    if (error && error.code !== '23505') {
      console.warn('No se pudo crear el perfil:', error.message);
    }
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      name: user.name,
      avatar: user.avatar,
      email: user.email.trim().toLowerCase(),
    })
    .eq('id', authUserId);
  if (error) {
    console.warn('No se pudo actualizar el perfil:', error.message);
  }
}

export async function fetchProfiles(): Promise<User[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('profiles').select('*');
  if (error || !data) {
    if (error) console.warn('No se pudieron leer perfiles:', error.message);
    return [];
  }
  return (data as ProfileRow[]).map(profileToUser);
}

export async function persistProfile(user: User, authUserId?: string) {
  if (!supabase) return;
  const id = isUuid(user.id) ? user.id : authUserId;
  if (!isUuid(id)) return;

  const payload: Record<string, unknown> = {
    id,
    email: user.email.trim().toLowerCase(),
    name: user.name,
    avatar: user.avatar,
    phone: user.phone || null,
    role: isPrimaryAdmin(user) ? 'admin' : user.role,
    building_id: user.buildingId ?? null,
    building_name: user.buildingName ?? null,
    specialty: user.specialty ?? null,
    unit_or_area: user.unitOrArea ?? null,
    provider: user.provider ?? 'google',
    status: user.status ?? 'active',
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('No se pudo guardar el rol:', error.message);
}

export function mergeUsersByEmail(local: User[], remote: User[]): User[] {
  const map = new Map<string, User>();
  for (const user of local) {
    map.set(user.email.trim().toLowerCase(), user);
  }
  for (const user of remote) {
    const key = user.email.trim().toLowerCase();
    const prev = map.get(key);
    map.set(
      key,
      prev
        ? { ...prev, ...user, id: isPrimaryAdmin(user) || isPrimaryAdmin(prev) ? ADMIN_USER.id : user.id }
        : user
    );
  }
  return [...map.values()];
}
