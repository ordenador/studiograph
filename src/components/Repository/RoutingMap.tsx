import { useId, useState } from 'react';
import { AudioLines, ChevronDown, ChevronUp, Drum, KeyboardMusic, SlidersHorizontal } from 'lucide-react';
import { HapaxHardware } from './HapaxHardware';
import { groupRoutes } from './routingModel';
import { portLabel, type Device, type Setup } from './repository';

function EquipmentIcon({ id, kind }: { id: string; kind: string }) {
  const Icon = id === 'ep-133' || kind.includes('drum') ? Drum
    : id === 'quad-cortex' || kind.includes('effect') ? AudioLines
    : id === 'spectravox' || id === '0-coast' ? SlidersHorizontal : KeyboardMusic;
  return <Icon size={32} strokeWidth={1.3} aria-hidden="true" />;
}

export function RoutingMap({ setup, devices, onEditTrack, onOpenDevice }: {
  setup: Setup; devices: Device[];
  onEditTrack: (number: number) => void; onOpenDevice?: (id: string) => void;
}) {
  const groups = groupRoutes(setup.tracks, devices);
  const [expanded, setExpanded] = useState<string | null>(null);
  const id = useId();
  return <section className="routing-section" aria-label={`Conexiones de ${setup.title}`}>
    <div className="routing-heading"><h2>Hapax → salida → equipo</h2><p>Selecciona un equipo para ver sus pistas.</p></div>
    {!groups.length ? <p className="repo-empty">Este setup aún no tiene pistas.</p> : <div className={`routing-map${setup.tracks.some(t => t.port !== 'NULL') ? ' routing-assigned' : ''}`}>
      <div className="routing-source">
        <div className="routing-source-body"><h3>Squarp Hapax</h3><HapaxHardware view="top" compact />
          <p>Clock {setup.clock_source === 'internal' ? 'interno' : setup.clock_source === 'external' ? 'externo' : setup.clock_source}</p>
          <span>{setup.tracks.length} de 16 pistas</span>
        </div>
      </div>
      <ol className="routing-destinations">{groups.map(group => {
        const open = expanded === group.id;
        const panelId = `${id}-${group.id}`;
        const channels = [...new Set(group.tracks.map(t => t.channel).filter(c => c > 0))];
        const channelLabel = channels.length ? `${channels.length === 1 ? 'Canal' : 'Canales'} ${channels.join(', ')}` : 'CV / Gate';
        return <li className="routing-row" key={group.id}>
          <div className="routing-ports">{group.routes.map(route => <div key={route.port} className={`routing-wire signal-${route.signal}`}>
            <span>{portLabel(route.port)}</span>
            <svg viewBox="0 0 140 20" preserveAspectRatio="none" aria-hidden="true" data-route={route.port}>
              {route.signal === 'pending' ? <path d="M40 10H92" strokeDasharray="4 5" />
                : <><path d="M0 10H136" /><path d="m130 5 7 5-7 5" /></>}
            </svg>
            {route.signal === 'pending' && <button onClick={() => onEditTrack(route.tracks[0].number)} aria-label={`Elegir salida para ${group.title}`}>Elegir salida</button>}
          </div>)}</div>
          <div className="routing-equipment">
            <button className="routing-target" aria-expanded={open} aria-controls={panelId} onClick={() => setExpanded(open ? null : group.id)}>
              <EquipmentIcon id={group.id} kind={group.kind} />
              <span><strong>{group.title}</strong><span>{group.tracks.map(t => t.name).join(' / ')}</span>
                <span>{group.tracks.length} {group.tracks.length === 1 ? 'pista' : 'pistas'} · {channelLabel}</span></span>
              {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            </button>
            <div id={panelId} className="routing-parts" hidden={!open}>
              <ul>{group.tracks.map(t => <li key={t.number}>
                <button onClick={() => onEditTrack(t.number)} aria-label={`Editar pista ${t.number}: ${t.name}`}>
                  <span className="routing-track-number">{String(t.number).padStart(2, '0')}</span>
                  <span><strong>{t.name}</strong><span>{portLabel(t.port)}{t.channel > 0 ? ` · Canal ${t.channel}` : ''}</span></span>
                  <span className="routing-edit-label">Editar</span>
                </button>
              </li>)}</ul>
              {onOpenDevice && <button className="routing-device-link" onClick={() => onOpenDevice(group.id)}>Ficha del equipo</button>}
            </div>
          </div>
        </li>;
      })}</ol>
    </div>}
    <div className="routing-legend"><span className="signal-midi">MIDI</span><span className="signal-usb">USB</span><span className="signal-cv">CV / Gate</span><span className="signal-pending">Sin asignar</span></div>
    <p className="routing-caption">{setup.physical_verified ? 'Cableado físico verificado en la ficha.' : 'Asignaciones del setup · cableado físico pendiente de verificar.'}</p>
  </section>;
}
