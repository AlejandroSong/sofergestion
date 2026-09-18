export type Role = 'admin' | 'president' | 'worker' | 'neighbor' | 'unassigned';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type TicketStatus = 'pendiente' | 'en_proceso' | 'resuelta' | 'rechazada';
export type TicketCategory =
  | 'agua'
  | 'luz'
  | 'puertas_accesos'
  | 'ascensor'
  | 'fontaneria'
  | 'estructural'
  | 'limpieza'
  | 'seguridad'
  | 'otros';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  phone: string;
  buildingId?: string; // For presidents & neighbors
  buildingName?: string;
  specialty?: string; // For workers
  unitOrArea?: string; // For neighbors (vivienda)
  taxReturnsRemaining?: number; // For neighbors
  provider?: 'email' | 'google';
  password?: string;
  status?: 'active' | 'suspended';
  feeBalance?: number; // Saldo de la cuenta del vecino
  monthlyFee?: number; // Cuota asignada al vecino
  feeFrequency?: 'mensual' | 'anual'; // Periodicidad: mensual o anual
  lastPaymentAmount?: number; // Importe del último pago realizado (€)
  lastPaymentDate?: string; // Fecha en la que se realizó el último pago
  lastPaymentConcept?: string; // Concepto o descripción del último pago
  nextDueDate?: string; // Fecha de la última cuota emitida o próxima cuota a liquidar
}

export interface CommonArea {
  id: string;
  name: string;
  category: 'garaje' | 'comedor' | 'pasillo' | 'jardin' | 'gimnasio' | 'azotea' | 'lobby' | 'piscina' | 'otro';
  categoryOther?: string;
  locationFloor: string; // e.g. "Sótano -1", "Planta Baja", "Piso 1", "General"
  description?: string;
  status: 'disponible' | 'en_mantenimiento' | 'restringido';
  createdAt?: string;
  companyName?: string; // Contrato con empresa
  contractDate?: string; // Fecha del contrato
  monthlyAmount?: number; // Importe a pagar mensual
}

export type UtilityServiceType =
  | 'gas'
  | 'agua'
  | 'internet'
  | 'electricidad'
  | 'ascensor'
  | 'limpieza'
  | 'seguridad'
  | 'basuras'
  | 'otro';

export interface FloorUtilityBill {
  id: string;
  floor: string; // e.g. "Piso 1", "Piso 2", "Planta Baja", "Sótano", "General"
  serviceType: UtilityServiceType;
  serviceTypeOther?: string;
  companyName: string; // Nombre de la compañía
  contractNumber: string; // Contrato
  startDate?: string;
  endDate?: string;
  monthlyAmount: number; // Importe que se debe pagar al mes
  paymentDayOfMonth?: number; // Día de cobro (1-31)
  billingFrequency?: 'mensual' | 'bimestral' | 'anual';
  status: 'activo' | 'en_revision' | 'suspendido';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BuildingInsurance {
  companyName: string;
  policyNumber: string;
  contractNumber?: string;
  startDate: string; // FECHA INICIAL
  endDate: string; // fecha de vencimiento
}

export interface ExceptionalExpense {
  id: string;
  name: string;
  reason: string;
  amount: number;
  dateIncurred: string;
  dueDate: string;
  status: 'pendiente' | 'pagado';
  createdAt: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  totalUnits: number;
  floors: number;
  presidentId: string;
  presidentName: string;
  presidentPhone: string;
  presidentEmail: string;
  image: string;
  monthlyQuotaFee: number;
  repairFund: number; // Dedicated money box for repairs and incidents
  initialRepairFund: number; // Initial allocated repair box budget
  currency: string;
  emergencyContact: string;
  bankAccount: string;
  createdAt: string;
  commonAreas?: CommonArea[];
  floorUtilityBills?: FloorUtilityBill[];
  insurance?: BuildingInsurance;
  exceptionalExpenses?: ExceptionalExpense[];
}

export interface TicketRepairExpense {
  id: string;
  concept: string;
  amount: number;
  date: string;
  workerId: string;
  workerName: string;
  category?: 'materiales' | 'repuestos' | 'mano_obra' | 'emergencia' | 'otro';
  categoryOther?: string;
  notes?: string;
}

export interface TicketTimelineEvent {
  id: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  action: string;
  notes?: string;
  statusFrom?: TicketStatus;
  statusTo?: TicketStatus;
  photoUrl?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  buildingId: string;
  buildingName: string;
  floor: string;
  unitOrArea: string;
  title: string;
  description: string;
  category: TicketCategory;
  categoryOther?: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: {
    id: string;
    name: string;
    role: Role;
  };
  createdAt: string;
  updatedAt: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedWorkerSpecialty?: string;
  timeline: TicketTimelineEvent[];
  photos: string[];
  serviceCost?: number;
  materialsCost?: number;
  totalCharged?: number;
  serviceIncomeRegistered?: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
  repairExpenses?: TicketRepairExpense[];
}

export interface WorkerPayout {
  id: string;
  code: string;
  workerId: string;
  workerName: string;
  workerSpecialty?: string;
  amount: number;
  date: string;
  status: 'pagado' | 'pendiente';
  paymentMethod: 'transferencia' | 'efectivo' | 'cheque';
  referenceNumber: string;
  period: string;
  notes?: string;
  approvedByAdmin: string;
}

export type TransactionType = 'ingreso' | 'gasto';
export type TransactionCategory =
  | 'cuota_mantenimiento'
  | 'servicio_reparacion'
  | 'pago_servicios_publicos'
  | 'limpieza_conserjeria'
  | 'seguridad_vigilancia'
  | 'compra_materiales'
  | 'honorarios_tecnicos'
  | 'fondo_reserva'
  | 'otros';

export interface Transaction {
  id: string;
  code: string;
  buildingId: string;
  buildingName: string;
  type: TransactionType;
  category: TransactionCategory;
  categoryOther?: string;
  description: string;
  amount: number;
  date: string;
  registeredBy: string;
  registeredByRole: Role;
  ticketId?: string;
  ticketNumber?: string;
  paymentMethod: 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque';
  referenceNumber?: string;
  status: 'completado' | 'pendiente';
}

export interface NeighborService {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: 'mantenimiento' | 'limpieza' | 'gestoria' | 'otros';
}

export interface NeighborServiceRequest {
  id: string;
  neighborId: string;
  neighborName: string;
  buildingId: string;
  unitOrArea: string;
  serviceId: string;
  serviceName: string;
  price: number;
  status: 'solicitado' | 'en_proceso' | 'completado' | 'cancelado';
  createdAt: string;
  scheduledDate?: string;
  notes?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'ticket_created' | 'ticket_status' | 'accounting_income' | 'accounting_expense' | 'system';
  buildingId?: string;
  buildingName?: string;
  ticketId?: string;
  timestamp: string;
  read: boolean;
  targetRoles: Role[];
}
