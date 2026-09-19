import { Building, NeighborService, NeighborServiceRequest, PushNotification, Ticket, Transaction, User, WorkerPayout } from '../types';
import { ADMIN_USER } from './users';

export const INITIAL_USERS: User[] = [ADMIN_USER];

/** Arranque vacío: el administrador da de alta fincas reales. */
export const INITIAL_BUILDINGS: Building[] = [];
export const INITIAL_TICKETS: Ticket[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_NOTIFICATIONS: PushNotification[] = [];
export const INITIAL_WORKER_PAYOUTS: WorkerPayout[] = [];
export const INITIAL_NEIGHBOR_REQUESTS: NeighborServiceRequest[] = [];

const DEMO_BUILDING_IDS = new Set(['bldg-1', 'bldg-2', 'bldg-3', 'bldg-4', 'bldg-5']);

export function isDemoBuildingId(id?: string) {
  return Boolean(id && DEMO_BUILDING_IDS.has(id));
}

export function stripDemoBuildings<T extends { id: string }>(items: T[]) {
  return items.filter((item) => !isDemoBuildingId(item.id));
}

export function stripDemoTickets(items: Ticket[]) {
  return items.filter((t) => !isDemoBuildingId(t.buildingId) && !/^tkt-00\d$/.test(t.id));
}

export function stripDemoTransactions(items: Transaction[]) {
  return items.filter((t) => !isDemoBuildingId(t.buildingId) && !/^tx-0\d{2}$/.test(t.id));
}

export function stripDemoPayouts(items: WorkerPayout[]) {
  return items.filter((p) => !/^pay-00\d$/.test(p.id));
}

export function stripDemoNotifications(items: PushNotification[]) {
  return items.filter((n) => !/^notif-\d$/.test(n.id) && !isDemoBuildingId(n.buildingId));
}

export function stripDemoRequests(items: NeighborServiceRequest[]) {
  return items.filter((r) => !/^nsr-\d$/.test(r.id) && !isDemoBuildingId(r.buildingId));
}

/** Catálogo SOFER de partida; el administrador puede editarlo. */
export const INITIAL_NEIGHBOR_SERVICES: NeighborService[] = [
  {
    id: 'ns-1',
    name: 'Limpieza de cristales (exterior e interior)',
    description: 'Servicio de limpieza profesional para ventanas, ventanales y cristaleras con tratamiento antihuellas.',
    price: 35.0,
    available: true,
    category: 'limpieza',
  },
  {
    id: 'ns-2',
    name: 'Mantenimiento y revisión de caldera/climatización',
    description: 'Revisión anual, análisis de combustión, limpieza de quemadores y purgado de radiadores.',
    price: 60.0,
    available: true,
    category: 'mantenimiento',
  },
  {
    id: 'ns-3',
    name: 'Gestión de certificado de eficiencia energética',
    description: 'Visita de técnico colegiado, toma de datos, registro oficial y entrega de etiqueta CEE.',
    price: 120.0,
    available: true,
    category: 'gestoria',
  },
  {
    id: 'ns-4',
    name: 'Fontanería urgente y desatascos en vivienda',
    description: 'Desatasco de fregaderos, inodoros o duchas y ajuste de cisternas con sellado antihumedad.',
    price: 45.0,
    available: true,
    category: 'mantenimiento',
  },
  {
    id: 'ns-5',
    name: 'Boletín eléctrico (CIE) y revisión de cuadro',
    description: 'Inspección de instalación eléctrica de baja tensión y emisión de certificado.',
    price: 85.0,
    available: true,
    category: 'mantenimiento',
  },
  {
    id: 'ns-6',
    name: 'Cerrajería de seguridad y bombín antibumping',
    description: 'Sustitución de cerradura o cilindro de alta seguridad y 5 llaves.',
    price: 75.0,
    available: true,
    category: 'mantenimiento',
  },
  {
    id: 'ns-7',
    name: 'Pintura higiénica y reparación de techos/paredes',
    description: 'Pintado con pintura plástica lavable antihongos y masillado de grietas (por estancia).',
    price: 95.0,
    available: true,
    category: 'mantenimiento',
  },
  {
    id: 'ns-8',
    name: 'Limpieza profunda y desinfección integral de hogar',
    description: 'Limpieza de cocina, baños, suelos y carpinterías con desinfección homologada.',
    price: 110.0,
    available: true,
    category: 'limpieza',
  },
  {
    id: 'ns-9',
    name: 'Asesoría fiscal y deducciones por vivienda habitual',
    description: 'Tramitación de bonificaciones del IBI, deducciones autonómicas y ayudas de rehabilitación.',
    price: 50.0,
    available: true,
    category: 'gestoria',
  },
];
