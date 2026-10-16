export type Connector = {
  x: number;
  y: number;
  label: string;
  name: string;
  kind: 'din' | 'trs' | 'usb-a' | 'usb-b';
  port?: string;
  input?: string;
};

export function hapaxHandlePort(handle: string): string {
  return /^midi-[a-d]$/.test(handle) ? handle.slice(-1).toUpperCase() : handle === 'usb-host' ? 'USBH' : handle === 'usb-device' ? 'USBD'
    : /^cv-[1-4]$/.test(handle) ? `CV${handle.slice(-1)}` : /^gate-[1-4]$/.test(handle) ? `G${handle.slice(-1)}` : '';
}

// Looking directly at the rear connectors, not through the front panel.
// Positions normalized from Squarp's straight rear packshot (not CAD dimensions):
// https://squarp.net/static/1785237772252.306630038613/06%20CONNECTIVITY.jpg
export const CONNECTORS: Connector[] = [
  { x: 129, y: 141, label: 'Host', name: 'USB host · bidireccional', kind: 'usb-a', port: 'USBH' },
  { x: 171, y: 138, label: 'Device', name: 'USB device · bidireccional', kind: 'usb-b', port: 'USBD' },
  ...[4, 3, 2, 1].map((n, i): Connector => ({ x: 346 + 29 * i, y: 140, label: String(n), name: `Gate out ${n}`, kind: 'trs', port: `G${n}` })),
  ...[4, 3, 2, 1].map((n, i): Connector => ({ x: 470 + 29 * i, y: 140, label: String(n), name: `CV out ${n}`, kind: 'trs', port: `CV${n}` })),
  ...[2, 1].map((n, i): Connector => ({ x: 594 + 30 * i, y: 140, label: String(n), name: `CV in ${n}`, kind: 'trs', input: `cv-in-${n}` })),
  { x: 664, y: 136, label: 'D', name: 'MIDI out D · TRS tipo A', kind: 'trs', port: 'D' },
  { x: 706, y: 128, label: 'C', name: 'MIDI out C · DIN', kind: 'din', port: 'C' },
  { x: 758, y: 128, label: 'B', name: 'MIDI out B · DIN', kind: 'din', port: 'B' },
  { x: 811, y: 128, label: 'A', name: 'MIDI out A · DIN', kind: 'din', port: 'A' },
  { x: 868, y: 136, label: 'B', name: 'MIDI in B · TRS tipo A', kind: 'trs', input: 'midi-in-2' },
  { x: 910, y: 128, label: 'A', name: 'MIDI in A · DIN', kind: 'din', input: 'midi-in-1' },
];

