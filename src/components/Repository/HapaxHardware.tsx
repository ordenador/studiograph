import React, { useState } from 'react';
import { CONNECTORS, type Connector } from './hardwareConnectors';
import type { PanelRoute } from './hardwareRouting';
import stepParameters from '../../assets/hapax/step-parameters.jpg';
import stepPianoRoll from '../../assets/hapax/step-piano-roll.jpg';

// Transcribed from step-piano-roll.jpg: the grey viewport is x=0..1023,
// y=328..455. Each of its 16 × 8 cells spans 64 × 16 source pixels.
// Notes above that viewport do not appear on the matrix. Light note starts,
// as in Squarp's Step pad diagram; lengths remain visible on the piano roll.
const STEP_REFERENCE_NOTES = [
  { row: 3, column: 7, length: 6 },
  { row: 4, column: 3, length: 3 },
  { row: 5, column: 13, length: 2 },
  { row: 6, column: 1, length: 1 },
  { row: 6, column: 6, length: 6 },
];
// Top to bottom, sampled from the official Step matrix diagram.
const STEP_REFERENCE_ROW_COLORS = ['#ecea95', '#7bb6ae', '#8fb795', '#bf697e', '#7e73b0', '#6e99cf', '#d0a15f', '#bd756a'];

type HapaxHardwareProps = {
  compact?: boolean;
  view?: 'rear' | 'top' | 'both';
  panelOnly?: boolean;
  activePorts?: string[];
  selectedPort?: string;
  routes?: PanelRoute[];
  onPortClick?: (port: string) => void;
  patchbay?: boolean;
  patchInputs?: number[];
};

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
      <circle r="22" fill="#09090b" stroke={color} strokeWidth="2" />
      <circle r="17" fill="#18181b" stroke="#3f3f46" />
      {[[-13, 1], [-9, 10], [0, 13], [9, 10], [13, 1]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.3" fill="#030304" stroke="#52525b" strokeWidth="0.6" />)}
      <rect x="-2" y="18" width="4" height="4" fill="#3f3f46" />
    </>;
  }
  if (kind === 'trs') {
    return <><circle r="7" fill="#b4b4b8" stroke={color} strokeWidth="1.5" /><circle r="4.3" fill="#09090b" /></>;
  }
  if (kind === 'usb-a') {
    return <><rect x="-18" y="-10" width="36" height="20" rx="1" fill="#b4b4b8" stroke={color} strokeWidth="1.5" /><rect x="-15" y="-7" width="30" height="14" fill="#09090b" /><rect x="-13" y="3" width="26" height="4" fill="#a1a1aa" />{[-9, -3, 3, 9].map(x => <rect key={x} x={x} y="3" width="2" height="3" fill="#52525b" />)}</>;
  }
  return <><rect x="-15" y="-14" width="30" height="28" fill="#b4b4b8" stroke={color} strokeWidth="1.5" /><path d="M-11 10V-5L-6-10H6L11-5V10Z" fill="#09090b" /><rect x="-6" y="-4" width="12" height="11" fill="#71717a" /></>;
}

/** Original vector reference of Hapax. Active means configured in the setup, not live MIDI. */
export function HapaxHardware({ view = 'rear', activePorts = [], onPortClick, compact = false, panelOnly = false, selectedPort = '', routes = [], patchbay = false, patchInputs = [] }: HapaxHardwareProps) {
  const id = React.useId();
  const [focusedPort, setFocusedPort] = useState<string | null>(null);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const routeRows = Math.ceil(routes.length / 5);
  const rearHeight = patchbay ? 190 : routes.length ? 410 + (routeRows - 1) * 120 : 235;

  if (view === 'both') {
    return <div className="hapax-panel-pair" role="group" aria-label="Paneles superior y trasero del Hapax">
      <figure><figcaption>Vista superior</figcaption><HapaxHardware view="top" compact panelOnly /></figure>
      <figure><figcaption>Panel trasero · mirando los conectores</figcaption>
        <HapaxHardware view="rear" compact panelOnly activePorts={activePorts} selectedPort={selectedPort} onPortClick={onPortClick} />
      </figure>
    </div>;
  }

  if (view === 'top') {
    // Geometry traced from Squarp's frontal packshot, normalized to the chassis:
    // https://squarp.net/static/1785237772331.308330038625/PACKSHOT%20WHITE%20FRONT.jpg
    // Static Step-mode screenshots from Squarp; provenance in assets/hapax/sources.json.
    const modeColors: Record<string, string> = { live: '#9d777d', step: '#79a394', pattern: '#aaa77b', autom: '#377f94' };
    const button = (x: number, y: number, label: string, secondary?: string, height = 34) => <g key={`${x}-${y}`}>
      <title>{`${label}${secondary ? ` · 2ND: ${secondary}` : ''}`}</title>
      <rect x={x} y={y} width="32" height={height} rx="2" fill={modeColors[label] ?? '#111113'} stroke="#a1a1aa" />
      {label === '2ND' && <rect x={x + 1} y={y + 1} width="30" height="11" fill="#a1a1aa" />}
      <text x={height === 16 ? x + 16 : x + 3} y={y + (height === 16 ? 11 : 9)} textAnchor={height === 16 ? 'middle' : undefined} fill={label === '2ND' ? '#111113' : '#f4f4f5'} fontSize="7" fontWeight="600">{label}</text>
      {secondary && <text x={x + 3} y={y + 29} fill="#d4d4d8" fontSize="5">{secondary}</text>}
    </g>;
    const encoder = (x: number, y: number, label: string) => <g key={`${x}-${y}`}>
      <title>{label}</title>
      <circle cx={x} cy={y} r="22" fill="#111113" stroke="#3f3f46" strokeWidth="2" />
      <circle cx={x} cy={y} r="17" fill="#1c1c1f" />
    </g>;
    return <div style={{ overflowX: 'auto' }}>
      <svg viewBox={panelOnly ? '0 12 1000 555' : '0 0 1000 585'} fontFamily="system-ui, sans-serif" style={{ display: 'block', width: '100%', minWidth: compact || panelOnly ? 0 : 560 }} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Hapax · vista superior de referencia</title>
        <desc id={descriptionId}>Panel con dos pantallas del mismo tamaño, ocho encoders de parámetros y un encoder de menú, dieciséis botones de pista, matriz de ciento veintiocho pads y cuatro teclas triangulares de navegación. Capturas estáticas oficiales del modo Step: parámetros de notas a la izquierda y piano roll a la derecha. Cinco pads muestran los inicios de nota del viewport gris, con los colores por fila de la referencia oficial. Las capturas no representan el proyecto abierto ni actividad MIDI en vivo.</desc>
        <rect x="18" y="12" width="964" height="555" rx="8" fill="#27272a" stroke="#71717a" />
        {[[42, 101], [454, 103], [960, 101], [42, 359], [960, 359], [42, 542], [451, 542], [960, 542]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#09090b" />)}
        {[95, 174, 485, 561].flatMap((x, column) => [47, 120].map((y, row) => encoder(x, y, `Encoder ${column < 2 ? 1 + column + row * 2 : 5 + column - 2 + row * 2}`)))}
        <g aria-label="Pantalla de parámetros">
          <title>Pantalla de parámetros</title>
          <rect x="234" y="28" width="195" height="125" rx="2" fill="#09090b" />
          <text x="244" y="38" fill="#d4d4d8" fontSize="6" fontWeight="600">Squarp</text>
          <text x="244" y="44" fill="#d4d4d8" fontSize="6" fontWeight="600">instruments</text>
          <text x="419" y="46" textAnchor="end" fill="#e4e4e7" fontSize="18" fontStyle="italic" fontWeight="800">HAPAX</text>
          <rect x="245" y="54" width="173" height="89" fill="#050506" />
          <image href={stepParameters} x="245" y="54" width="173" height="89" preserveAspectRatio="xMidYMid meet">
            <title>Referencia oficial de Step: nota C5, velocidad 100, duración 1 y parámetros uTime, Chance, Roll y Math</title>
          </image>
        </g>
        <g aria-label="Pantalla de menú">
          <title>Pantalla de menú</title>
          <rect x="658" y="28" width="195" height="125" rx="2" fill="#09090b" />
          <text x="669" y="46" fill="#d4d4d8" fontSize="6" fontWeight="600">professional clockwork sequencer</text>
          <rect x="669" y="54" width="173" height="89" fill="#050506" />
          <image href={stepPianoRoll} x="669" y="54" width="173" height="89" preserveAspectRatio="xMidYMid meet">
            <title>Referencia oficial de Step: piano roll del proyecto proA con notas y viewport</title>
          </image>
        </g>
        {encoder(906, 88, 'Encoder de menú')}
        {Array.from({ length: 16 }, (_, i) => <g key={`track-${i}`}>
          <rect x={112 + i * 43} y="167" width="32" height="16" rx="2" fill="#111113" stroke="#a1a1aa" />
          <text x={115 + i * 43} y="178" fontSize="8" fill="#e4e4e7" fontWeight="600">{i + 1}</text>
          {i === 15 && <text x="772" y="177" fontSize="4" fill="#d4d4d8">TRSP</text>}
        </g>)}
        {Array.from({ length: 8 }, (_, row) => Array.from({ length: 16 }, (_, column) => {
          const note = STEP_REFERENCE_NOTES.find(n => n.row === row && n.column === column);
          return <rect key={`pad-${row}-${column}`} x={112 + column * 43} y={193 + row * 43} width="34" height="34" rx="2"
            fill={note ? STEP_REFERENCE_ROW_COLORS[row] : '#94969e'} stroke={note ? STEP_REFERENCE_ROW_COLORS[row] : '#71717a'}>
            {note && <title>{`Nota de referencia · fila ${row + 1} desde arriba · paso ${column + 1} · duración ${note.length} ${note.length === 1 ? 'paso' : 'pasos'}`}</title>}
          </rect>;
        }))}
        {[279, 451, 624].map(x => <g key={x}><circle cx={x} cy="360" r="5" fill="#d4d4d8" /><circle cx={x} cy="360" r="2" fill="#71717a" /></g>)}
        {button(58, 167, 'mute', undefined, 16)}
        {['2ND', 'algo', 'copy', 'paste', 'delete'].map((label, i) => button(58, 193 + i * 43, label))}
        {['Grabar', 'Detener', 'Reproducir'].map((label, i) => <g key={label} transform={`translate(58 ${408 + i * 43})`}>
          <title>{label}</title>
          <rect width="32" height="34" rx="2" fill="#111113" stroke={i === 0 ? '#bf8d96' : i === 2 ? '#96b9ab' : '#a1a1aa'} />
          {i === 0 ? <circle cx="16" cy="17" r="7" fill="none" stroke="#bf8d96" strokeWidth="2" />
            : i === 1 ? <rect x="9" y="10" width="14" height="14" fill="none" stroke="#d4d4d8" strokeWidth="2" />
              : <path d="M11 9L24 17L11 25Z" fill="none" stroke="#96b9ab" strokeWidth="2" />}
        </g>)}
        {Array.from({ length: 8 }, (_, i) => button(812, 193 + i * 43, '←'))}
        {button(812, 167, 'all', undefined, 16)}
        {button(867, 167, 'proA', undefined, 16)}
        {button(910, 167, 'proB', undefined, 16)}
        {[
          [['live'], ['step']], [['pattern'], ['autom']], [['settings', 'REC'], ['effects', 'PROJ']],
          [['fill', 'ASSIGN'], ['bpm']], [['snapshot'], ['undo', 'REDO']], [['−'], ['+']],
        ].flatMap((labels, row) => labels.map(([label, secondary], column) => button(867 + column * 43, 193 + row * 43, label, secondary)))}
        {/* Four separate triangular keys; the X is the gap between them. */}
        <g aria-label="Teclas de navegación" fill="#111113" stroke="#a1a1aa" strokeWidth="2" strokeLinejoin="round">
          <path d="M879 452H930L904.5 481Z"><title>Arriba</title></path>
          <path d="M867 464V514L895 489Z"><title>Izquierda</title></path>
          <path d="M942 464V514L914 489Z"><title>Derecha</title></path>
          <path d="M879 526H930L904.5 497Z"><title>Abajo</title></path>
        </g>
        {!compact && !panelOnly && <text x="500" y="583" textAnchor="middle" fontSize="12" fill="#a1a1aa">Modo Step · capturas de referencia de Squarp · sin conexión en vivo</text>}
      </svg>
    </div>;
  }

  return <div style={{ overflowX: 'auto' }}>
    <svg viewBox={panelOnly ? '0 60 1000 120' : `0 0 1000 ${rearHeight}`} fontFamily="system-ui, sans-serif" style={{ display: 'block', width: '100%', minWidth: panelOnly ? 0 : 900 }} role="group" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>Hapax · panel trasero, mirando los conectores</title>
      <desc id={descriptionId}>Referencia del panel trasero. {patchbay ? 'Las salidas del diseño tienen color. Los puntos inferiores permiten dibujar cables y los superiores recibir retornos.' : 'Las salidas configuradas se distinguen por un borde de color y una marca.'} {onPortClick ? 'Activa una salida con clic, Enter o espacio para seleccionarla en el editor.' : 'Las entradas, alimentación, SD y pedal se muestran como referencia.'} No indica conexión física ni actividad MIDI.</desc>
      {!panelOnly && <text x="24" y="27" fill="#e4e4e7" fontSize="15">Panel trasero · mirando los conectores</text>}
      <rect x="18" y="64" width="946" height="112" rx="4" fill="#27272a" stroke="#71717a" />
      <g aria-label="Interruptor de alimentación"><title>Interruptor de alimentación</title><circle cx="56" cy="140" r="12" fill="#111113" stroke="#3f3f46" strokeWidth="2" /><circle cx="56" cy="140" r="8" fill="#1c1c1f" /></g>
      <g aria-label="Alimentación 15 V DC"><title>Alimentación 15 V DC</title><rect x="77" y="125" width="24" height="28" fill="#111113" stroke="#3f3f46" /><circle cx="89" cy="138" r="8" fill="#09090b" /><circle cx="89" cy="138" r="2" fill="#a1a1aa" /></g>
      <text x="89" y="105" textAnchor="middle" fill="#d4d4d8" fontSize="9">15 V DC</text>
      <g aria-label="Ranura SD"><title>Ranura SD</title><rect x="197" y="143" width="72" height="12" fill="#111113" /><rect x="200" y="146" width="66" height="6" fill="#09090b" stroke="#a1a1aa" /></g>
      <g aria-label="Switch · pedal de 6,35 mm"><title>Switch · pedal de 6,35 mm</title><circle cx="306" cy="132" r="12" fill="#09090b" stroke="#52525b" strokeWidth="2" /><circle cx="306" cy="132" r="8" fill="#111113" /></g>
      {[{ x: 72, text: 'Power' }, { x: 150, text: 'USB ↔' }, { x: 233, text: 'SD card' }, { x: 306, text: 'Switch' }, { x: 389, text: 'Gate out' }, { x: 514, text: 'CV out' }, { x: 609, text: 'CV in' }, { x: 748, text: 'MIDI out' }, { x: 889, text: 'MIDI in' }].map(({ x, text }) => <text key={text} x={x} y="85" textAnchor="middle" fill="#d4d4d8" fontSize="11">{text}</text>)}
      <path d="M335 91H445 M459 91H569 M583 91H635 M653 91H835 M856 91H936" stroke="#71717a" />
      {patchbay && <g aria-hidden="true">
        {CONNECTORS.filter(c => c.port).map(c => <path key={c.name} d={`M${c.x} ${c.y + (c.kind === 'din' ? 24 : 17)}V190`} stroke={portActive(c.port, activePorts) ? connectorColor(c.port) : '#52525b'} strokeWidth="2" />)}
        {patchInputs.map(x => <path key={x} d={`M${x} 0V63`} stroke="#52525b" strokeWidth="1" />)}
      </g>}
      {CONNECTORS.map((connector) => {
        const active = portActive(connector.port, activePorts);
        const focused = focusedPort === connector.port || portActive(connector.port, [selectedPort]);
        const interactive = !!connector.port && !!onPortClick;
        const color = active ? connectorColor(connector.port) : '#a1a1aa';
        const hitHalfWidth = connector.kind === 'trs' ? 12 : connector.kind === 'din' ? 24 : 20;
        return <g
          key={connector.name}
          transform={`translate(${connector.x} ${connector.y})`}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={`${connector.name}${active ? patchbay ? ' · conectado en el diseño' : ' · configurado en el setup' : ''}`}
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
          <rect x={-hitHalfWidth} y={96 - connector.y} width={hitHalfWidth * 2} height="77" rx="2" fill="transparent" stroke={focused ? '#fafafa' : 'transparent'} strokeWidth="2" />
          <ConnectorShape kind={connector.kind} color={color} />
          <text y={105 - connector.y} textAnchor="middle" fill="#f4f4f5" fontSize="10">{connector.label}</text>
          {active && <path d="M-7 27H7" stroke={color} strokeWidth="3" />}
        </g>;
      })}
      {routes.map((route, index) => {
        const row = Math.floor(index / 5);
        const count = Math.min(5, routes.length - row * 5);
        const x = (index % 5 + .5) * 1000 / count;
        const y = 280 + row * 120;
        const color = connectorColor(route.port);
        return <g key={`${route.port}:${route.device}`} role="img" aria-label={`${route.title} · ${route.label}`}>
          <title>{`${route.title} · ${route.label} · pistas ${route.tracks.map(t => t.number).join(', ')}`}</title>
          {route.sources.map(source => <g key={source}>
            <circle cx={source} cy="179" r="3" fill={color} />
            <path data-route={route.port} d={`M${source} 179 C${source} ${210 + row * 20},${x} ${y - 40},${x} ${y}`} fill="none" stroke={color} strokeWidth="2" />
          </g>)}
          <foreignObject x={x - 86} y={y} width="172" height="86">
            <div style={{ padding: 10, background: '#18181b', border: `1px solid ${color}`, borderRadius: 4, color: '#f4f4f5', fontSize: 12, lineHeight: 1.4 }}>
              <strong style={{ display: 'block', fontWeight: 500 }}>{route.title}</strong>
              <span style={{ display: 'block', color: '#a1a1aa', marginTop: 4 }}>{route.label}</span>
            </div>
          </foreignObject>
        </g>;
      })}
      {!patchbay && !panelOnly && <><text x="24" y={rearHeight - 36} fill="#a1a1aa" fontSize="12">Marca de color = salida configurada en el setup</text>
      <text x="24" y={rearHeight - 14} fill="#a1a1aa" fontSize="12">Referencia de conectores · no acredita cableado físico ni actividad MIDI</text></>}
    </svg>
  </div>;
}
