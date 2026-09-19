import { User } from '../types';

export const ACCOUNTS_RESET_KEY = 'gest_v4_accounts';
export const ACCOUNTS_RESET_VALUE = 'roles-handoff-v1';

export const ADMIN_USER: User = {
  id: 'usr-adm-99',
  name: 'David Robles',
  email: 'DavidAlejandroRoblesMarquez@gmail.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  phone: '+34 612 345 678',
  status: 'active',
};

const DEMO_EMAILS = new Set([
  'alvaro.castillo@email.es',
  'valeria.montero@email.es',
  'fernando.rios@comunidad.es',
  'isabel.ferrer@comunidad.es',
  'antonio.delgado@comunidad.es',
  'clara.guzman@comunidad.es',
  'hector.paredes@comunidad.es',
  'daniel.ortega@servicios.es',
  'mateo.iglesias@servicios.es',
  'marcos.delapena@servicios.es',
  'admin@gestioninmuebles.com',
]);

export const isPrimaryAdmin = (user: User) => {
  const email = (user.email || '').trim().toLowerCase();
  return (
    user.id === ADMIN_USER.id ||
    user.id === 'user-admin-1' ||
    email === ADMIN_USER.email.toLowerCase()
  );
};

export const isDemoAccount = (user: User) => {
  if (isPrimaryAdmin(user)) return false;
  if (/^usr-(ngb|prs|wrk)-/i.test(user.id)) return true;
  return DEMO_EMAILS.has((user.email || '').trim().toLowerCase());
};

export const isLastActiveAdmin = (user: User, allUsers: User[]) => {
  if (user.role !== 'admin' || user.status === 'suspended') return false;
  const admins = allUsers.filter((u) => u.role === 'admin' && u.status !== 'suspended');
  return admins.length <= 1;
};

export const sanitizeUser = (user: User): User => ({
  ...user,
  name: user.name || (user.email || '').split('@')[0] || 'Usuario',
  email: user.email || '',
  role: user.role || 'unassigned',
  avatar: user.avatar || ADMIN_USER.avatar,
  phone: user.phone || '+34 600 000 000',
});

export const withSingleAdmin = (loaded: User[]): User[] => {
  const others = loaded.filter((u) => !isDemoAccount(u)).map(sanitizeUser);
  if (!others.length) return [ADMIN_USER];
  const hasAdmin = others.some((u) => u.role === 'admin' && u.status !== 'suspended');
  if (hasAdmin) return others;
  return [{ ...others[0], role: 'admin', status: 'active' }, ...others.slice(1)];
};
