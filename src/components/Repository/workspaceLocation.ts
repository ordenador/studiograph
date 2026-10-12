import type { Selection } from './repository';

export type SetupView = 'overview' | 'tracks' | 'hardware' | 'diagram' | 'settings';
export interface WorkspaceLocation {
  setup: string;
  device: string;
  view: SetupView | 'home';
  track: number;
  panel: 'rear' | 'top';
  port: string;
}
const tabs = { home: 'home', connections: 'overview', overview: 'overview', tracks: 'tracks',
  hapax: 'hardware', hardware: 'hardware', canvas: 'diagram', diagram: 'diagram', settings: 'settings' } as const;
const names = { home: 'home', overview: 'connections', tracks: 'tracks', hardware: 'hapax', diagram: 'canvas', settings: 'settings' };

export function readLocation(search: string): WorkspaceLocation {
  const query = new URLSearchParams(search);
  const tab = query.get('tab') || (query.has('setup') && !query.has('device') ? 'connections' : 'home');
  const track = Number(query.get('track'));
  const port = query.get('port') || '';
  return { setup: query.get('setup') || 'studio', device: query.get('device') || '',
    view: Object.hasOwn(tabs, tab) ? tabs[tab as keyof typeof tabs] : 'home',
    track: Number.isInteger(track) && track >= 1 && track <= 16 ? track : 0,
    panel: query.get('panel') === 'top' ? 'top' : 'rear',
    port: /^(?:[A-D]|USB[HD]|(?:CVG|CV|G)[1-4])$/.test(port) ? port : '' };
}

export function locationQuery(location: WorkspaceLocation) {
  const query = new URLSearchParams({ setup: location.setup });
  if (location.device) query.set('device', location.device);
  else {
    query.set('tab', names[location.view]);
    if (location.view !== 'home' && location.track) query.set('track', String(location.track));
    if (location.view === 'hardware') {
      if (location.panel === 'top') query.set('panel', 'top');
      if (location.port) query.set('port', location.port);
    }
  }
  return `?${query}`;
}

export function selectionFor(location: WorkspaceLocation): Selection | null {
  return location.device ? { category: 'devices', id: location.device }
    : location.view === 'home' ? null : { category: 'setups', id: location.setup };
}

export function sameRecord(a: WorkspaceLocation, b: WorkspaceLocation) {
  const first = selectionFor(a); const second = selectionFor(b);
  return first?.category === second?.category && first?.id === second?.id;
}

export function openLocation(next: Selection | null, current: WorkspaceLocation, track = 0): WorkspaceLocation {
  return { setup: next?.category === 'setups' ? next.id : current.setup,
    device: next?.category === 'devices' ? next.id : '',
    view: next?.category === 'setups' ? track ? 'tracks' : 'overview' : 'home',
    track, panel: 'rear', port: '' };
}
