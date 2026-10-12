import React, { useState } from 'react';

type HapaxHardwareProps = {
  compact?: boolean;
  view?: 'rear' | 'top';
  activePorts?: string[];
  onPortClick?: (port: string) => void;
};

type Connector = {
  x: number;
  label: string;
  name: string;
  kind: 'din' | 'trs' | 'usb-a' | 'usb-b';
  port?: string;
};

// Looking directly at the rear connectors, not through the front panel.
// Positions are a readable schematic based on packshots; they are not CAD dimensions.
const CONNECTORS: Connector[] = [
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

function portActive(port: string | undefined, activePorts: string[]): boolean {
  if (!port) return false;
  if (activePorts.includes(port)) return true;
  const pair = /^(?:CV|G)([1-4])$/.exec(port);
  return !!pair && activePorts.includes(`CVG${pair[1]}`);
}

function connectorColor(port: string | undefined): string {
  if (port?.startsWith('USB')) return '#22d3ee';
  if (port?.startsWith('CV') || port?.startsWith('G')) return '#eab308';
  return '#3b82f6';
}

function ConnectorShape({ kind, color }: { kind: Connector['kind']; color: string }) {
  if (kind === 'din') {
    return <>
      <circle r="18" fill="#0c0c0e" stroke={color} strokeWidth="2" />
      <path d="M-10 10 A14 14 0 1 1 10 10" fill="none" stroke="#707078" />
      {[[-10, 2], [-7, -6], [0, -9], [7, -6], [10, 2]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#a1a1aa" />)}
      <rect x="-3" y="9" width="6" height="4" fill="#707078" />
    </>;
  }
  if (kind === 'trs') {
    return <><circle r="8" fill="#0c0c0e" stroke={color} strokeWidth="2" /><circle r="4" fill="#27272a" /></>;
  }
  if (kind === 'usb-a') {
    return <><rect x="-16" y="-9" width="32" height="18" fill="#0c0c0e" stroke={color} strokeWidth="2" /><rect x="-10" y="-1" width="20" height="4" fill="#71717a" /></>;
  }
  return <><path d="M-11 11 V-5 L-5-11 H5 L11-5 V11 Z" fill="#0c0c0e" stroke={color} strokeWidth="2" /><rect x="-5" y="-5" width="10" height="10" fill="#71717a" /></>;
}

/** Original vector reference of Hapax. Active means configured in the setup, not live MIDI. */
export function HapaxHardware({ view = 'rear', activePorts = [], onPortClick, compact = false }: HapaxHardwareProps) {
  const id = React.useId();
  const [focusedPort, setFocusedPort] = useState<string | null>(null);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  if (view === 'top') {
    const button = (x: number, y: number, label: string, color = '#111113', width = 30) => <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={width} height="25" rx="2" fill={color} stroke="#a1a1aa" />
      <text x={x + width / 2} y={y + 16} textAnchor="middle" fill="#f4f4f5" fontSize="8">{label}</text>
    </g>;
    return <div style={{ overflowX: 'auto' }}>
      <svg viewBox="0 0 1000 585" fontFamily="system-ui, sans-serif" style={{ display: 'block', width: '100%', minWidth: compact ? 0 : 560 }} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Hapax · vista superior de referencia</title>
        <desc id={descriptionId}>Panel con dos pantallas, ocho encoders de parámetros y un encoder de menú, dieciséis botones de pista y matriz de ciento veintiocho pads. Sin notas ni actividad de reproducción representadas.</desc>
        <rect x="18" y="12" width="964" height="555" rx="8" fill="#27272a" stroke="#71717a" />
        {[[40, 34], [960, 34], [40, 544], [960, 544], [40, 358], [960, 358]].map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="4" fill="#09090b" /><path d={`M${x - 2} ${y}h4`} stroke="#71717a" /></g>)}
        <text x="280" y="43" fill="#e4e4e7" fontSize="18" fontWeight="700">HAPAX</text>
        {[77, 154, 457, 534].flatMap((x) => [52, 124].map((y) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="21" fill="#111113" stroke="#52525b" strokeWidth="3" /><path d={`M${x} ${y - 17}v6`} stroke="#a1a1aa" strokeWidth="2" /></g>))}
        <rect x="216" y="55" width="174" height="113" fill="#09090b" stroke="#52525b" />
        <text x="229" y="77" fill="#d4d4d8" fontSize="10">Pantalla de parámetros</text>
        <path d="M229 88H377 M229 112H377 M229 136H377" stroke="#3f3f46" />
        <rect x="643" y="34" width="209" height="134" fill="#09090b" stroke="#52525b" />
        <text x="657" y="58" fill="#d4d4d8" fontSize="10">Pantalla de menú</text>
        <path d="M657 70H838 M657 92H838 M657 114H838" stroke="#3f3f46" />
        <circle cx="914" cy="102" r="23" fill="#111113" stroke="#52525b" strokeWidth="3" />
        <path d="M914 83v6" stroke="#a1a1aa" strokeWidth="2" />
        {Array.from({ length: 16 }, (_, i) => <g key={`track-${i}`}>
          <rect x={106 + i * 42} y="189" width="33" height="16" rx="2" fill="#111113" stroke="#a1a1aa" />
          <text x={122.5 + i * 42} y="201" textAnchor="middle" fontSize="9" fill="#e4e4e7">{i + 1}</text>
        </g>)}
        {Array.from({ length: 8 }, (_, row) => Array.from({ length: 16 }, (_, column) => <rect key={`pad-${row}-${column}`} x={106 + column * 42} y={218 + row * 41} width="33" height="33" rx="2" fill="#a1a1aa" stroke="#71717a" />))}
        {['mute', '2ND', 'algo', 'copy', 'paste', 'delete', '●', '■', '▶'].map((label, i) => button(49, 180 + i * 41, label))}
        {Array.from({ length: 8 }, (_, i) => button(803, 222 + i * 41, '←'))}
        {button(803, 180, 'all')}
        {button(859, 180, 'proA', '#111113', 38)}
        {button(910, 180, 'proB', '#111113', 38)}
        {[
          ['live', 'step'], ['pattern', 'autom'], ['settings', 'effects'], ['fill', 'bpm'], ['snapshot', 'undo'], ['−', '+'],
        ].flatMap((labels, row) => labels.map((label, column) => button(859 + column * 51, 218 + row * 41, label, '#111113', 38)))}
        <path d="M861 470H876L900 490L925 470H940V483L915 501L940 520V533H925L900 512L876 533H861V520L885 501L861 483Z" fill="#111113" stroke="#a1a1aa" strokeWidth="2" />
        {!compact && <text x="500" y="583" textAnchor="middle" fontSize="12" fill="#a1a1aa">Vista de referencia · pads neutros, sin reproducción simulada</text>}
      </svg>
    </div>;
  }

  return <div style={{ overflowX: 'auto' }}>
    <svg viewBox="0 0 1000 235" fontFamily="system-ui, sans-serif" style={{ display: 'block', width: '100%', minWidth: 900 }} role="group" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>Hapax · panel trasero, mirando los conectores</title>
      <desc id={descriptionId}>Referencia del panel trasero. Las salidas configuradas se distinguen por un borde de color y una marca. {onPortClick ? 'Activa una salida con clic, Enter o espacio para seleccionarla en el editor.' : 'Las entradas, alimentación, SD y pedal se muestran como referencia.'} No indica conexión física ni actividad MIDI.</desc>
      <text x="24" y="27" fill="#e4e4e7" fontSize="15">Panel trasero · mirando los conectores</text>
      <rect x="18" y="64" width="946" height="106" rx="4" fill="#27272a" stroke="#71717a" />
      {[[34, 75], [948, 75], [34, 158], [948, 158]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#09090b" />)}
      <circle cx="40" cy="107" r="10" fill="#111113" stroke="#71717a" />
      <path d="M40 101v7 M36 104a6 6 0 1 0 8 0" fill="none" stroke="#a1a1aa" />
      <rect x="61" y="96" width="22" height="22" fill="#111113" />
      <circle cx="72" cy="107" r="7" fill="#09090b" stroke="#71717a" /><circle cx="72" cy="107" r="2" fill="#a1a1aa" />
      <text x="56" y="149" textAnchor="middle" fill="#d4d4d8" fontSize="11">Power</text>
      <rect x="180" y="101" width="40" height="7" fill="#09090b" stroke="#71717a" />
      <text x="200" y="149" textAnchor="middle" fill="#d4d4d8" fontSize="11">SD</text>
      <circle cx="244" cy="107" r="10" fill="#09090b" stroke="#71717a" /><circle cx="244" cy="107" r="6" fill="#27272a" />
      <text x="244" y="149" textAnchor="middle" fill="#d4d4d8" fontSize="11">Switch</text>
      {[{ x: 125, text: 'USB ↔' }, { x: 337, text: 'Gate out' }, { x: 477, text: 'CV out' }, { x: 585, text: 'CV in' }, { x: 724, text: 'MIDI out' }, { x: 884, text: 'MIDI in' }].map(({ x, text }) => <text key={text} x={x} y="86" textAnchor="middle" fill="#d4d4d8" fontSize="11">{text}</text>)}
      {CONNECTORS.map((connector) => {
        const active = portActive(connector.port, activePorts);
        const focused = focusedPort === connector.port;
        const interactive = !!connector.port && !!onPortClick;
        const color = active ? connectorColor(connector.port) : '#a1a1aa';
        return <g
          key={connector.name}
          transform={`translate(${connector.x} 111)`}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={`${connector.name}${active ? ' · configurado en el setup' : ''}`}
          data-port={connector.port}
          onClick={interactive ? () => onPortClick?.(connector.port!) : undefined}
          onKeyDown={interactive ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onPortClick?.(connector.port!);
            }
          } : undefined}
          onFocus={() => setFocusedPort(connector.port ?? null)}
          onBlur={() => setFocusedPort(null)}
          style={{ cursor: interactive ? 'pointer' : 'default', outline: 'none' }}
        >
          <title>{`${connector.name}${active ? ' · configurado' : ''}`}</title>
          <rect x={connector.kind === 'trs' ? -15 : -20} y="-21" width={connector.kind === 'trs' ? 30 : 40} height="65" rx="2" fill="transparent" stroke={focused ? '#fafafa' : 'transparent'} strokeWidth="2" />
          <ConnectorShape kind={connector.kind} color={color} />
          <text y="38" textAnchor="middle" fill="#f4f4f5" fontSize="11">{connector.label}</text>
          {active && <path d="M-7 44H7" stroke={color} strokeWidth="3" />}
        </g>;
      })}
      <path d="M278 158H396 M418 158H536 M558 158H612 M633 158H819 M845 158H929" stroke="#71717a" />
      <text x="24" y="199" fill="#a1a1aa" fontSize="12">Marca de color = salida configurada en el setup</text>
      <text x="24" y="221" fill="#a1a1aa" fontSize="12">Referencia de conectores · no acredita cableado físico ni actividad MIDI</text>
    </svg>
  </div>;
}
