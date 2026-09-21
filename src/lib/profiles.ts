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
    floor: (() => {
      const raw = row.unit_or_area || '';
      const match = raw.match(/piso\s*([^·•,\-]+)/i);
      return match ? match[1].trim() : undefined;
    })(),
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

export async function ensureSelfAdmin() {
  if (!supabase) return;
  const { error } = await supabase.rpc('ensure_self_admin');
  if (error) {
    console.warn('No se pudo confirmar el administrador:', error.message);
  }
}

export async function upsertProfile(user: User, authUserId: string): Promise<{ created: boolean }> {
  if (!supabase || !isUuid(authUserId)) return { created: false };

  const isAdmin = user.email.trim().toLowerCase() === ADMIN_USER.email.toLowerCase();
  await ensureSelfAdmin();
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', authUserId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from('profiles').insert({
      ...corePayload(user, authUserId),
      role: isAdmin ? 'admin' : user.role && user.role !== 'unassigned' ? user.role : 'unassigned',
    });
    if (error && error.code !== '23505') {
      console.warn('No se pudo crear el perfil:', error.message);
      return { created: false };
    }
    return { created: !isAdmin && (!user.role || user.role === 'unassigned') };
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
  const revoked = new Set((await fetchRevokedEmails()).map((email) => email.trim().toLowerCase()));
  return (data as ProfileRow[])
    .map(profileToUser)
    .filter((user) => !revoked.has(user.email.trim().toLowerCase()));
}

export async function persistProfile(user: User, authUserId?: string): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: true };
  const email = user.email.trim().toLowerCase();

  await ensureSelfAdmin();
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
    if (!rpcError) return { ok: true };
    return {
      ok: false,
      message: rpcError.message || 'No se encontró el perfil de este usuario en Supabase.',
    };
  }

  const { error, data } = await supabase.from('profiles').update(patch).eq('id', id).select('id');
  if (!rpcError) {
    if (error) console.warn('Perfil extra no se pudo completar:', error.message);
    return { ok: true };
  }
  if (error) {
    console.warn('No se pudo guardar el perfil:', error.message);
    return { ok: false, message: rpcError.message || error.message };
  }
  if (!data?.length) {
    return {
      ok: false,
      message: rpcError.message || 'No hay permiso para guardar la cuenta. Vuelve a ejecutar supabase/profiles.sql.',
    };
  }
  return { ok: true };
}

export async function revokeAccess(email: string) {
  if (!supabase) return;
  const normalized = email.trim().toLowerCase();
  const rpc = await supabase.rpc('remove_profile_by_email', { target_email: normalized });
  if (!rpc.error) return;
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

export type RoleDirectoryEntry = {
  email: string;
  role: User['role'];
  name?: string;
  buildingId?: string;
  buildingName?: string;
  specialty?: string;
  unitOrArea?: string;
  floor?: string;
  status?: User['status'];
};

export function toRoleDirectory(users: User[]): RoleDirectoryEntry[] {
  return users.map((u) => ({
    email: u.email.trim().toLowerCase(),
    role: u.role,
    name: u.name,
    buildingId: u.buildingId,
    buildingName: u.buildingName,
    specialty: u.specialty,
    unitOrArea: u.unitOrArea,
    floor: u.floor,
    status: u.status,
  }));
}

export function assignedRole(role?: User['role']) {
  return role && role !== 'unassigned' ? role : undefined;
}

export function mergeRoleDirectories(
  local: RoleDirectoryEntry[],
  remote: RoleDirectoryEntry[]
): RoleDirectoryEntry[] {
  const map = new Map<string, RoleDirectoryEntry>();
  const put = (row: RoleDirectoryEntry) => {
    const email = (row.email || '').trim().toLowerCase();
    if (!email) return;
    const prev = map.get(email);
    if (!prev) {
      map.set(email, { ...row, email });
      return;
    }
    const role = assignedRole(row.role) || assignedRole(prev.role) || row.role || prev.role;
    map.set(email, {
      ...prev,
      ...row,
      email,
      role,
      name: row.name || prev.name,
      buildingId: row.buildingId ?? prev.buildingId,
      buildingName: row.buildingName ?? prev.buildingName,
      specialty: row.specialty ?? prev.specialty,
      unitOrArea: row.unitOrArea ?? prev.unitOrArea,
      floor: row.floor ?? prev.floor,
      status: row.status ?? prev.status,
    });
  };
  remote.forEach(put);
  local.forEach(put);
  return [...map.values()];
}

export function applyRoleDirectory(users: User[], directory: RoleDirectoryEntry[]): User[] {
  const dir = new Map(
    directory
      .filter((row) => row.email)
      .map((row) => [row.email.trim().toLowerCase(), row] as const)
  );
  const next = users.map((user) => {
    const entry = dir.get(user.email.trim().toLowerCase());
    if (!entry) return user;
    return {
      ...user,
      role: assignedRole(entry.role) || assignedRole(user.role) || entry.role || user.role,
      name: entry.name || user.name,
      buildingId: entry.buildingId ?? user.buildingId,
      buildingName: entry.buildingName ?? user.buildingName,
      specialty: entry.specialty ?? user.specialty,
      unitOrArea: entry.unitOrArea ?? user.unitOrArea,
      floor: entry.floor ?? user.floor,
      status: entry.status ?? user.status,
    };
  });
  for (const entry of dir.values()) {
    if (next.some((u) => u.email.trim().toLowerCase() === entry.email)) continue;
    next.push({
      id: `dir-${entry.email}`,
      name: entry.name || entry.email.split('@')[0],
      email: entry.email,
      role: entry.role || 'unassigned',
      avatar: ADMIN_USER.avatar,
      phone: '+34 600 000 000',
      buildingId: entry.buildingId,
      buildingName: entry.buildingName,
      specialty: entry.specialty,
      unitOrArea: entry.unitOrArea,
      floor: entry.floor,
      provider: 'google',
      status: entry.status || 'active',
    });
  }
  return next;
}

export function mergeUsersByEmail(local: User[], remote: User[]): User[] {
  const map = new Map<string, User>();
  for (const user of local) {
    map.set(user.email.trim().toLowerCase(), user);
  }
  for (const user of remote) {
    const key = user.email.trim().toLowerCase();
    const prev = map.get(key);
    if (!prev) {
      map.set(key, user);
      continue;
    }
    const role = assignedRole(user.role) || assignedRole(prev.role) || user.role || prev.role;
    map.set(key, {
      ...prev,
      ...user,
      role,
      buildingId: user.buildingId ?? prev.buildingId,
      buildingName: user.buildingName ?? prev.buildingName,
      specialty: user.specialty ?? prev.specialty,
      unitOrArea: user.unitOrArea ?? prev.unitOrArea,
      floor: user.floor ?? prev.floor,
    });
  }
  return [...map.values()];
}
