import { Building, PushNotification, Ticket, TicketCategory, TicketPriority } from '../types';

const REPORTERS = [
  'Lucía Pérez',
  'Miguel Soto',
  'Ana Beltrán',
  'Jorge Rivas',
  'Carmen Díaz',
  'Pablo Núñez',
  'Elena Vargas',
  'Héctor Molina',
  'Sofía Romero',
  'Iván Castillo',
];

const EVENTS: Array<{
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}> = [
  { title: 'Fuga de agua en bajante', description: 'Hay agua en el rellano y gotea al piso inferior.', category: 'fontaneria', priority: 'urgente' },
  { title: 'Ascensor parado entre plantas', description: 'El ascensor no responde y hay vecinos atrapados.', category: 'ascensor', priority: 'urgente' },
  { title: 'Olor a gas en cocina', description: 'Se percibe olor a gas en la vivienda y el rellano.', category: 'seguridad', priority: 'urgente' },
  { title: 'Corte de luz en el portal', description: 'El cuadro general saltó y el portal está a oscuras.', category: 'luz', priority: 'alta' },
  { title: 'Cristal de portal roto', description: 'Han forzado la puerta y el cristal está en el suelo.', category: 'puertas_accesos', priority: 'alta' },
  { title: 'Calefacción no calienta', description: 'Los radiadores están fríos en toda la escalera.', category: 'otros', priority: 'media' },
  { title: 'Portería sucia tras obra', description: 'Hay escombros y polvo en zonas comunes.', category: 'limpieza', priority: 'baja' },
  { title: 'Antena de TV sin señal', description: 'Varias viviendas se han quedado sin televisión.', category: 'otros', priority: 'media' },
  { title: 'Persiana comunitaria atascada', description: 'No se puede cerrar el acceso al garaje.', category: 'puertas_accesos', priority: 'alta' },
  { title: 'Humedad en techo de trastero', description: 'Mancha creciente y goteo intermitente.', category: 'agua', priority: 'media' },
];

export function buildIncidentWave(
  buildings: Building[],
  ticketCountStart: number,
  count = 24
): { tickets: Ticket[]; notifications: PushNotification[] } {
  const list = buildings.length ? buildings : [];
  const tickets: Ticket[] = [];
  const notifications: PushNotification[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const bldg = list[i % list.length];
    if (!bldg) break;
    const event = EVENTS[i % EVENTS.length];
    const reporter = REPORTERS[i % REPORTERS.length];
    const floor = String((i % Math.max(1, bldg.floors)) + 1);
    const unit = `${floor}º ${String.fromCharCode(65 + (i % 4))}`;
    const createdAt = new Date(now + i * 180).toISOString();
    const ticketId = crypto.randomUUID();
    const ticketNumber = `TCK-${new Date().getFullYear()}-${String(ticketCountStart + i + 1).padStart(3, '0')}`;

    tickets.push({
      id: ticketId,
      ticketNumber,
      buildingId: bldg.id,
      buildingName: bldg.name,
      floor,
      unitOrArea: unit,
      title: event.title,
      description: `${reporter} (vecino): ${event.description}`,
      category: event.category,
      priority: event.priority,
      status: 'pendiente',
      createdBy: { id: `bot-${i}`, name: reporter, role: 'neighbor' },
      createdAt,
      updatedAt: createdAt,
      photos: [],
      timeline: [
        {
          id: crypto.randomUUID(),
          timestamp: createdAt,
          authorId: `bot-${i}`,
          authorName: reporter,
          authorRole: 'neighbor',
          action: `Incidencia reportada por ${reporter}`,
          notes: event.description,
          statusTo: 'pendiente',
        },
      ],
    });

    notifications.push({
      id: crypto.randomUUID(),
      title: event.priority === 'urgente' ? '🚨 INCIDENCIA URGENTE' : '📋 Nueva incidencia',
      message: `${reporter} avisó en ${bldg.name} (Piso ${floor}, ${unit}): "${event.title}"`,
      type: 'ticket_created',
      buildingId: bldg.id,
      buildingName: bldg.name,
      ticketId,
      timestamp: createdAt,
      read: false,
      targetRoles: ['admin', 'worker', 'president', 'neighbor'],
    });
  }

  return { tickets, notifications };
}
