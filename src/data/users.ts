import { User } from '../types';

export const ACCOUNTS_RESET_KEY = 'gest_v3_accounts';
export const ACCOUNTS_RESET_VALUE = 'david-only-v2';

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
  'support@revengeofpirates.com',
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

export const withSingleAdmin = (loaded: User[]): User[] => {
  const others = loaded.filter((u) => !isPrimaryAdmin(u) && !isDemoAccount(u));
  return [ADMIN_USER, ...others];
};
