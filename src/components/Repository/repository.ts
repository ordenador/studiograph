export interface Track {
  number: number;
  name: string;
  device: string;
  port: string;
  channel: number;
  definition: string;
}
export type Layout = Record<string, { x: number; y: number }>;
export interface Setup {
  id: string;
  title: string;
  status: string;
  clock_source: string;
  physical_verified: boolean;
  tracks: Track[];
  studio_layout?: Layout;
}
export interface Device {
  id: string;
  title: string;
  kind: string;
  firmware: string;
  status: string;
  notes?: string;
}
export interface Definition {
  name: string;
  type: string;
  ccCount: number;
  nrpnCount: number;
  drumCount: number;
}
export interface Library {
  repository: string;
  devices: Device[];
  setups: Setup[];
  definitions: Definition[];
  ports: string[];
  songs: { id: string; title: string; setup: string; bpm: number }[];
}
export type Selection = { category: 'setups' | 'devices'; id: string };
export interface Envelope<T> { record: T; revision: string; path: string }

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/hapax/${path}`, options);
  let data;
  try { data = await response.json(); }
  catch { throw new Error('La API del repo no esta disponible. Inicia la app con make oconfig-dev.'); }
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud.');
  return data as T;
}

export function changes(category: Selection['category'], record: Setup | Device) {
  if (category === 'devices') {
    const d = record as Device;
    return { title: d.title, kind: d.kind, firmware: d.firmware, status: d.status, notes: d.notes || '' };
  }
  const s = record as Setup;
  const layoutIds = new Set(['hapax', ...s.tracks.map(t => `device:${t.device}`)]);
  return { title: s.title, clock_source: s.clock_source,
    tracks: s.tracks.map(({ number, name, device, port, channel, definition }) => ({ number, name, device, port, channel, definition })),
    studio_layout: Object.fromEntries(Object.entries(s.studio_layout || {}).filter(([id]) => layoutIds.has(id))) };
}

export function isDirty(category: Selection['category'], a: Setup | Device, b: Setup | Device) {
  return JSON.stringify(changes(category, a)) !== JSON.stringify(changes(category, b));
}

export function portLabel(port: string) {
  if (port === 'NULL') return 'Sin asignar';
  if (/^[A-D]$/.test(port)) return `MIDI ${port}`;
  if (port === 'USBH') return 'USB Host';
  if (port === 'USBD') return 'USB Device';
  if (port.startsWith('CVG')) return `CV/Gate ${port.slice(3)}`;
  if (port.startsWith('CV')) return `CV ${port.slice(2)}`;
  if (port.startsWith('G')) return `Gate ${port.slice(1)}`;
  return port;
}

export function stateLabel(state: string) {
  return ({ proposed: 'Propuesto', emulator_validated: 'Probado en emulador', draft: 'Borrador',
    reported_not_verified: 'Informado, sin verificar', not_verified: 'Sin verificar' } as Record<string, string>)[state] || state;
}

export function routeWarnings(tracks: Track[]) {
  const warnings: string[] = [];
  for (const t of tracks) {
    if (t.port === 'NULL') warnings.push(`Pista ${t.number}: salida sin asignar.`);
    if (!t.port.startsWith('CV') && !t.port.startsWith('G') && t.channel === 0) warnings.push(`Pista ${t.number}: MIDI requiere canal 1–16.`);
  }
  const routes = new Map<string, Track[]>();
  for (const t of tracks.filter(t => t.port !== 'NULL')) {
    const key = `${t.port}:${t.channel}`;
    routes.set(key, [...(routes.get(key) || []), t]);
  }
  for (const [key, ts] of routes) {
    if (new Set(ts.map(t => t.device)).size > 1) warnings.push(`${key}: varios equipos comparten salida y canal. Revisar el routing.`);
  }
  return warnings;
}
