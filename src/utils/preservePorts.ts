import type { Port } from '../types';

// A metadata/map edit must not change port identity or disconnect existing wires.
export function preservePortIds(original: Port[], generated: Port[]): Port[] {
  const role = (p: Port) => `${p.type}:${p.type === 'midi' && p.id.includes('thru') ? 'thru' : 'normal'}`;
  const used = new Set<string>();
  const counts = new Map<string, number>();
  return generated.map(p => {
    const key = role(p); const index = counts.get(key) || 0;
    counts.set(key, index + 1);
    const existing = original.filter(o => role(o) === key)[index];
    if (existing) { used.add(existing.id); return { ...existing }; }
    let id = p.id; let suffix = 1;
    while (used.has(id) || original.some(o => o.id === id)) id = `${p.id}-new-${suffix++}`;
    used.add(id); return { ...p, id };
  });
}
