export function asText(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

export function asMoney(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function matchesQuery(query: string, ...fields: unknown[]): boolean {
  const q = asText(query).trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => asText(field).toLowerCase().includes(q));
}

export function statusLabel(status: unknown): string {
  return asText(status).replace(/_/g, ' ') || 'pendiente';
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'administrador de fincas',
  president: 'presidente de la comunidad',
  worker: 'trabajador / operario',
  neighbor: 'vecino / residente',
  unassigned: 'usuario sin rol',
};

export function roleLabel(role: unknown): string {
  const key = asText(role).trim().toLowerCase();
  return ROLE_LABELS[key] || asText(role) || 'sin rol';
}

export function initials(name: unknown): string {
  const parts = asText(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
