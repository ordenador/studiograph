import type { Device, Track } from './repository';

export function signalKind(port: string) {
  if (port === 'NULL') return 'pending';
  if (/^[A-D]$/.test(port)) return 'midi';
  if (port === 'USBH' || port === 'USBD') return 'usb';
  if (/^(?:CVG|CV|G)[1-4]$/.test(port)) return 'cv';
  return 'other';
}

/** One physical unit per group; multiple parts or outputs do not duplicate it. */
export function groupRoutes(tracks: Track[], devices: Device[]) {
  const sorted = [...tracks].sort((a, b) => a.number - b.number);
  return [...new Set(sorted.map(t => t.device))].map(id => {
    const parts = sorted.filter(t => t.device === id);
    return {
      id, title: devices.find(d => d.id === id)?.title || id,
      kind: devices.find(d => d.id === id)?.kind || '',
      tracks: parts,
      routes: [...new Set(parts.map(t => t.port))].map(port => ({
        port, signal: signalKind(port), tracks: parts.filter(t => t.port === port),
      })),
    };
  });
}
