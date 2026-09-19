export function parseIsoDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const match = String(iso).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatIsoDateEs(
  iso?: string | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
): string {
  const date = parseIsoDate(iso);
  if (!date) return 'No registrada';
  return date.toLocaleDateString('es-ES', options);
}

export function addPeriodToIso(iso: string, frequency: 'mensual' | 'anual'): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  if (frequency === 'anual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function currentPeriodLabel(): string {
  const now = new Date();
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

export function nextMonthFifthIso(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = month === 12 ? now.getFullYear() + 1 : now.getFullYear();
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${year}-${String(nextMonth).padStart(2, '0')}-05`;
}
