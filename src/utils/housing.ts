export function composeHousing(floor: string, door: string) {
  const f = floor.trim();
  const d = door.trim();
  if (f && d) return `Piso ${f} · Nº ${d}`;
  if (d) return d;
  if (f) return `Piso ${f}`;
  return '';
}

export function parseHousing(unitOrArea?: string, floor?: string) {
  if (floor && unitOrArea && !/piso\s/i.test(unitOrArea)) {
    return { floor: floor.trim(), door: unitOrArea.trim() };
  }
  const raw = (unitOrArea || '').trim();
  const match = raw.match(/piso\s*([^·•,\-]+)\s*[·•,\-]\s*(?:n[ºo°.]?\s*)?(.*)$/i);
  if (match) {
    return { floor: match[1].trim(), door: match[2].trim() };
  }
  return { floor: (floor || '').trim(), door: raw };
}
