import { CONNECTORS } from './hardwareConnectors';
import { portLabel, type Device, type Track } from './repository';

export interface PanelRoute {
  port: string;
  device: string;
  title: string;
  sources: number[];
  tracks: Track[];
  label: string;
}

export function panelRoutes(tracks: Track[], devices: Device[]): PanelRoute[] {
  const groups = new Map<string, Track[]>();
  for (const track of tracks) {
    if (track.port === 'NULL') continue;
    const key = `${track.port}:${track.device}`;
    groups.set(key, [...(groups.get(key) || []), track]);
  }
  const routes: PanelRoute[] = [];
  for (const parts of groups.values()) {
    const { port, device } = parts[0];
    const pair = /^CVG([1-4])$/.exec(port);
    const ports = pair ? [`CV${pair[1]}`, `G${pair[1]}`] : [port];
    const sources = CONNECTORS.filter(c => c.port && ports.includes(c.port)).map(c => c.x);
    if (!sources.length) continue;
    const channels = [...new Set(parts.map(t => t.channel).filter(n => n > 0))];
    routes.push({ port, device, sources, tracks: parts,
      title: devices.find(d => d.id === device)?.title || device,
      label: `${portLabel(port)}${channels.length ? ` · CH ${channels.join(', ')}` : ''}` });
  }
  const midpoint = (r: PanelRoute) => r.sources.reduce((sum, x) => sum + x, 0) / r.sources.length;
  return routes.sort((a, b) => midpoint(a) - midpoint(b));
}
