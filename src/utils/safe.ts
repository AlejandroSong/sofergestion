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

export function initials(name: unknown): string {
  const parts = asText(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
