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
  monthly_fee: number | null;
  fee_balance: number | null;
  fee_frequency: User['feeFrequency'] | null;
};

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

export function userToProfile(user: User, authUserId?: string) {
  return {
    id: isPrimaryAdmin(user) && authUserId ? authUserId : user.id,
    email: user.email.trim().toLowerCase(),
    name: user.name,
    avatar: user.avatar,
    phone: user.phone,
    role: isPrimaryAdmin(user) ? 'admin' : user.role,
    building_id: user.buildingId ?? null,
    building_name: user.buildingName ?? null,
    specialty: user.specialty ?? null,
    unit_or_area: user.unitOrArea ?? null,
    provider: user.provider ?? 'google',
    status: user.status ?? 'active',
    monthly_fee: user.monthlyFee ?? null,
    fee_balance: user.feeBalance ?? null,
    fee_frequency: user.feeFrequency ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertProfile(user: User, authUserId: string) {
  if (!supabase) return;
  const payload = userToProfile(user, authUserId);
  payload.id = authUserId;
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.warn('No se pudo guardar el perfil en Supabase:', error.message);
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
  if (!user.id.includes('-') && user.id.length < 30 && !authUserId && !isPrimaryAdmin(user)) {
    return;
  }
  const payload = userToProfile(user, authUserId);
  if (!/^[0-9a-f-]{36}$/i.test(payload.id)) return;
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('No se pudo actualizar el perfil:', error.message);
}

export function mergeUsersByEmail(local: User[], remote: User[]): User[] {
  const map = new Map<string, User>();
  for (const user of local) {
    map.set(user.email.trim().toLowerCase(), user);
  }
  for (const user of remote) {
    const key = user.email.trim().toLowerCase();
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, ...user, id: isPrimaryAdmin(user) || isPrimaryAdmin(prev) ? ADMIN_USER.id : user.id } : user);
  }
  return [...map.values()];
}
