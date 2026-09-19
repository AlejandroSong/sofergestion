import type { User } from '../types';
import { ADMIN_USER } from '../data/users';
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
  last_payment_amount?: number | null;
  last_payment_date?: string | null;
  last_payment_concept?: string | null;
  next_due_date?: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function profileToUser(row: ProfileRow): User {
  const email = (row.email || '').trim();
  return {
    id: row.id,
    name: row.name || email.split('@')[0],
    email,
    role: (row.role as User['role']) || 'unassigned',
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
    lastPaymentAmount: row.last_payment_amount ?? undefined,
    lastPaymentDate: row.last_payment_date || undefined,
    lastPaymentConcept: row.last_payment_concept || undefined,
    nextDueDate: row.next_due_date || undefined,
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

export async function upsertProfile(user: User, authUserId: string): Promise<{ created: boolean }> {
  if (!supabase || !isUuid(authUserId)) return { created: false };

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
      return { created: false };
    }
    return { created: !isAdmin };
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
  return { created: false };
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

export async function persistProfile(user: User, authUserId?: string): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: true };
  const email = user.email.trim().toLowerCase();

  const { error: rpcError } = await supabase.rpc('assign_profile_role', {
    target_email: email,
    new_role: user.role,
    new_status: user.status ?? 'active',
    new_building_id: user.buildingId ?? null,
    new_building_name: user.buildingName ?? null,
    new_specialty: user.specialty ?? null,
    new_unit_or_area: user.unitOrArea ?? null,
  });

  const patch = {
    name: user.name,
    avatar: user.avatar,
    phone: user.phone || null,
    role: user.role,
    building_id: user.buildingId ?? null,
    building_name: user.buildingName ?? null,
    specialty: user.specialty ?? null,
    unit_or_area: user.unitOrArea ?? null,
    provider: user.provider ?? 'google',
    status: user.status ?? 'active',
    monthly_fee: user.monthlyFee ?? null,
    fee_balance: user.feeBalance ?? null,
    fee_frequency: user.feeFrequency ?? null,
    last_payment_amount: user.lastPaymentAmount ?? null,
    last_payment_date: user.lastPaymentDate || null,
    last_payment_concept: user.lastPaymentConcept ?? null,
    next_due_date: user.nextDueDate || null,
  };

  let id = isUuid(user.id) ? user.id : undefined;
  if (!id) {
    const { data } = await supabase.from('profiles').select('id, email');
    const match = (data || []).find((row) => (row.email || '').trim().toLowerCase() === email);
    id = match?.id;
  }
  if (!isUuid(id) && isUuid(authUserId)) {
    const { data: self } = await supabase.auth.getUser();
    if (self.user?.email?.trim().toLowerCase() === email) {
      id = authUserId;
    }
  }
  if (!isUuid(id)) {
    return {
      ok: false,
      message: rpcError?.message || 'No se encontró el perfil de este usuario en Supabase.',
    };
  }

  const { error, data } = await supabase.from('profiles').update(patch).eq('id', id).select('id');
  if (error) {
    console.warn('No se pudo guardar el perfil:', error.message);
    return { ok: false, message: error.message };
  }
  if (!data?.length) {
    return {
      ok: false,
      message: rpcError?.message || 'No hay permiso para guardar la cuenta. Vuelve a ejecutar supabase/profiles.sql.',
    };
  }
  return { ok: true };
}

export async function revokeAccess(email: string) {
  if (!supabase) return;
  const normalized = email.trim().toLowerCase();
  await supabase.from('access_revocations').upsert({ email: normalized });
  await supabase.from('profiles').delete().eq('email', normalized);
}

export async function clearRevocation(email: string) {
  if (!supabase) return;
  await supabase.from('access_revocations').delete().eq('email', email.trim().toLowerCase());
}

export async function fetchRevokedEmails(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('access_revocations').select('email').order('revoked_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row) => row.email);
}

export async function isEmailRevoked(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('access_revocations')
    .select('email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export function mergeUsersByEmail(local: User[], remote: User[]): User[] {
  const map = new Map<string, User>();
  for (const user of local) {
    map.set(user.email.trim().toLowerCase(), user);
  }
  for (const user of remote) {
    const key = user.email.trim().toLowerCase();
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, ...user } : user);
  }
  return [...map.values()];
}
