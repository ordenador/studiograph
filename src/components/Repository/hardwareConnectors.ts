export type Connector = {
  x: number;
  label: string;
  name: string;
  kind: 'din' | 'trs' | 'usb-a' | 'usb-b';
  port?: string;
};

// Looking directly at the rear connectors, not through the front panel.
// Positions are a readable schematic based on packshots; they are not CAD dimensions.
export const CONNECTORS: Connector[] = [
  { x: 103, label: 'Host', name: 'USB host · bidireccional', kind: 'usb-a', port: 'USBH' },
  { x: 147, label: 'Device', name: 'USB device · bidireccional', kind: 'usb-b', port: 'USBD' },
  ...[4, 3, 2, 1].map((n, i): Connector => ({ x: 289 + 32 * i, label: String(n), name: `Gate out ${n}`, kind: 'trs', port: `G${n}` })),
  ...[4, 3, 2, 1].map((n, i): Connector => ({ x: 429 + 32 * i, label: String(n), name: `CV out ${n}`, kind: 'trs', port: `CV${n}` })),
  ...[2, 1].map((n, i): Connector => ({ x: 569 + 32 * i, label: String(n), name: `CV in ${n}`, kind: 'trs' })),
  { x: 649, label: 'D', name: 'MIDI out D · TRS tipo A', kind: 'trs', port: 'D' },
  { x: 699, label: 'C', name: 'MIDI out C · DIN', kind: 'din', port: 'C' },
  { x: 749, label: 'B', name: 'MIDI out B · DIN', kind: 'din', port: 'B' },
  { x: 799, label: 'A', name: 'MIDI out A · DIN', kind: 'din', port: 'A' },
  { x: 859, label: 'B', name: 'MIDI in B · TRS tipo A', kind: 'trs' },
  { x: 909, label: 'A', name: 'MIDI in A · DIN', kind: 'din' },
];

