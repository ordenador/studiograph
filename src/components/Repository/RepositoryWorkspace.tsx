import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Save, RefreshCw, Undo2, Plus, X, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { HapaxHardware } from './HapaxHardware';
import { RepositoryHome } from './RepositoryHome';
import { RoutingMap } from './RoutingMap';
import { CopyViewLink } from './CopyViewLink';
import { locationQuery, openLocation, selectionFor, type WorkspaceLocation } from './workspaceLocation';
import { useWorkspaceNavigation } from './useWorkspaceNavigation';
import { panelRoutes } from './hardwareRouting';
import { changes, isDirty, portLabel, request, routeWarnings, stateLabel,
  type Device, type Envelope, type Library, type Selection, type Setup, type Track } from './repository';
import './repository.css';

const RepositoryCableEditor = lazy(() => import('./RepositoryCableEditor').then(module => ({ default: module.RepositoryCableEditor })));

function Dialog({ children, title, onClose, className = '' }: { children: React.ReactNode; title: string; onClose: () => void; className?: string }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, [tabindex="0"]') || [])];
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const elements = focusable(); const first = elements[0]; const last = elements.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <div className="repo-overlay"><section ref={panel} className={`repo-dialog ${className}`} role="dialog" aria-modal="true" aria-label={title}>{children}</section></div>;
}

function DefinitionDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const [content, setContent] = useState('Cargando…');
  useEffect(() => { let active = true;
    request<{ text: string }>(`definitions/${encodeURIComponent(name)}`).then(r => { if (active) setContent(r.text); })
      .catch(e => { if (active) setContent(e.message); });
    return () => { active = false; };
  }, [name]);
  return <Dialog title={name} onClose={onClose} className="repo-definition-dialog">
    <header><h2 id="definition-title">{name}</h2><button aria-label="Cerrar definición" onClick={onClose}><X size={18} /></button></header>
    <p>Definición compartida · Solo lectura</p><pre tabIndex={0}>{content}</pre>
  </Dialog>;
}

function TrackList({ setup, library, focusedTrack, onFocusTrack, onChange, onDefinition }: {
  setup: Setup; library: Library; focusedTrack: number; onFocusTrack: (number: number) => void;
  onChange: (tracks: Track[]) => void; onDefinition: (name: string) => void;
}) {
  const update = (index: number, patch: Partial<Track>) => onChange(setup.tracks.map((t, i) => i === index ? { ...t, ...patch } : t));
  return <section className="repo-track-list" aria-label="Pistas del setup"><p className="repo-muted">Abre una pista para editar su equipo, salida, canal y definición.</p>
    {setup.tracks.map((t, index) => <article className="repo-track" key={t.number}>
      <button className="repo-track-summary" aria-expanded={focusedTrack === t.number} aria-controls={`track-${t.number}`} onClick={() => onFocusTrack(focusedTrack === t.number ? 0 : t.number)}>
        <span className="routing-track-number">{String(t.number).padStart(2, '0')}</span><strong>{t.name}</strong>
        <span>{library.devices.find(d => d.id === t.device)?.title || t.device}</span><span>{portLabel(t.port)}{t.channel > 0 ? ` · Canal ${t.channel}` : ''}</span>
        {focusedTrack === t.number ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>
      <div id={`track-${t.number}`} hidden={focusedTrack !== t.number}>{focusedTrack === t.number && <div className="repo-track-fields">
    <label>Nombre<input autoFocus aria-label={`Nombre pista ${t.number}`} value={t.name} maxLength={64} onChange={e => update(index, { name: e.target.value })} /></label>
    <label>Equipo<select aria-label={`Equipo pista ${t.number}`} value={t.device} onChange={e => update(index, { device: e.target.value })}>
      {library.devices.filter(d => d.id !== 'hapax').map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
    </select></label>
    <label>Salida<select aria-label={`Salida pista ${t.number}`} value={t.port} onChange={e => {
      const port = e.target.value; update(index, { port, channel: port.startsWith('CV') || port.startsWith('G') ? 0 : t.channel || 1 });
    }}>{library.ports.map(p => <option key={p} value={p}>{portLabel(p)}</option>)}</select></label>
    <label>Canal{t.port.startsWith('CV') || t.port.startsWith('G') ? <span className="repo-muted">CV/Gate no usa canal MIDI</span> :
      <input type="number" aria-label={`Canal pista ${t.number}`} min={1} max={16} value={t.channel} onChange={e => update(index, { channel: Number(e.target.value) })} />}</label>
    <label className="repo-track-definition">Definición<div className="repo-definition-select"><select aria-label={`Definición pista ${t.number}`} value={t.definition} onChange={e => update(index, { definition: e.target.value })}>
      {library.definitions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
    </select><button onClick={() => onDefinition(t.definition)} aria-label={`Ver definición pista ${t.number}`}>Ver</button></div>
      <span className="repo-definition-meta">{(() => { const d = library.definitions.find(d => d.name === t.definition); return d ? `${d.type} · ${d.ccCount} CC · ${d.nrpnCount} NRPN` : ''; })()}</span></label>
    <button className="repo-remove repo-track-remove" aria-label={`Quitar pista ${t.number}`} onClick={() => onChange(setup.tracks.filter((_, i) => i !== index))}><X size={16} />Quitar pista</button>
      </div>}</div>
  </article>)}{!setup.tracks.length && <p className="repo-empty">Este setup aún no tiene pistas. Añade un equipo para empezar.</p>}</section>;
}

function Editor({ selection, library, location, onNavigate, onSaved, onDirty }: { selection: Selection; library: Library;
  location: WorkspaceLocation; onNavigate: (location: WorkspaceLocation) => void;
  onSaved: (selection: Selection, record: Setup | Device) => void; onDirty: (dirty: boolean) => void }) {
  const [base, setBase] = useState<Envelope<Setup | Device> | null>(null);
  const [draft, setDraft] = useState<Setup | Device | null>(null);
  const [history, setHistory] = useState<(Setup | Device)[]>([]);
  const view = location.view;
  const focusedTrack = location.track;
  const [hardwareTrack, setHardwareTrack] = useState(0);
  const focusedPort = location.port;
  const [definition, setDefinition] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const dirty = !!draft && !!base && isDirty(selection.category, draft, base.record);
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  useEffect(() => { let active = true;
    request<Envelope<Setup | Device>>(`${selection.category}/${selection.id}`).then(r => {
      if (active) { setBase(r); setDraft(r.record); }
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [selection.category, selection.id]);
  const edit = (next: Setup | Device) => {
    if (busy) return;
    if (draft) setHistory(old => [...old.slice(-49), draft]);
    setDraft(next); setMessage(''); setError('');
  };
  const save = useCallback(async () => {
    if (!draft || !base || busy || !dirty) return;
    setBusy(true); setError('');
    try {
      const r = await request<Envelope<Setup | Device>>(`${selection.category}/${selection.id}`, { method: 'PUT',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: base.revision, changes: changes(selection.category, draft) }) });
      setBase(r); setDraft(r.record); setHistory([]); setMessage('Guardado en el repo'); onSaved(selection, r.record);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  }, [draft, base, busy, dirty, selection, onSaved]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void save(); } };
    const leave = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('keydown', key); window.addEventListener('beforeunload', leave);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('beforeunload', leave); };
  }, [dirty, save]);
  const reload = async () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Descartarlos y recargar desde el repo?')) return;
    setBusy(true);
    try { const r = await request<Envelope<Setup | Device>>(`${selection.category}/${selection.id}`);
      setBase(r); setDraft(r.record); setHistory([]); setMessage('Recargado desde el repo'); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo recargar.'); }
    finally { setBusy(false); }
  };
  if (!draft || !base) return <main className="repo-content"><p className={error ? 'repo-error' : 'repo-muted'}>{error || 'Cargando ficha…'}</p></main>;
  const setup = selection.category === 'setups' ? draft as Setup : null;
  const device = selection.category === 'devices' ? draft as Device : null;
  const warnings = setup ? routeWarnings(setup.tracks) : [];
  const configuredRoutes = setup ? panelRoutes(setup.tracks, library.devices) : [];
  const pendingTracks = setup?.tracks.filter(t => t.port === 'NULL') || [];
  const changeTracks = (tracks: Track[]) => { if (setup) edit({ ...setup, tracks }); };
  const addTrack = () => {
    if (!setup) return;
    const number = Array.from({ length: 16 }, (_, i) => i + 1).find(n => !setup.tracks.some(t => t.number === n));
    const d = library.devices.find(d => d.id !== 'hapax'); const def = library.definitions[0];
    if (!number || !d || !def) return;
    const known = library.setups.flatMap(s => s.tracks).find(t => t.device === d.id);
    changeTracks([...setup.tracks, { number, name: `Pista ${number}`, device: d.id, definition: known?.definition || def.name, port: 'NULL', channel: 1 }]);
    onNavigate({ ...location, track: number });
  };
  const metadata = <div className="repo-metadata"><label>Nombre<input value={draft.title} maxLength={256} onChange={e => edit({ ...draft, title: e.target.value })} /></label>
    {setup && <label>Clock<select value={setup.clock_source} onChange={e => edit({ ...setup, clock_source: e.target.value })}>
      {[...new Set(['internal', 'external', setup.clock_source])].map(c => <option key={c} value={c}>{c === 'internal' ? 'Interno' : c === 'external' ? 'Externo' : c}</option>)}
    </select></label>}
    <div className="repo-record-state"><span>{stateLabel(draft.status)}</span>{setup && <span>{setup.physical_verified ? 'Verificación física registrada' : 'Sin verificación física registrada'}</span>}</div>
  </div>;
  return <main className="repo-content">
    <header className="repo-toolbar"><div><span className="repo-muted">{selection.category === 'setups' ? 'Setup' : 'Equipo'}</span>
      <strong>{draft.title}</strong></div><div className="repo-toolbar-actions">
      <span role="status" aria-live="polite">{busy ? 'Guardando…' : dirty ? 'Cambios sin guardar' : message || 'Sin cambios'}</span>
      <CopyViewLink key={locationQuery(location)} dirty={dirty} />
      <button title="Deshacer último cambio" disabled={!history.length || busy} onClick={() => {
        const prev = history.at(-1); if (prev) { setDraft(prev); setHistory(history.slice(0, -1)); setError(''); }
      }}><Undo2 size={16} /><span>Deshacer</span></button>
      <button disabled={busy} onClick={() => void reload()}><RefreshCw size={16} /><span>Recargar</span></button>
      <button className="repo-primary" disabled={!dirty || busy} onClick={() => void save()}><Save size={16} />Guardar en repo</button>
    </div></header>
    {error && <div role="alert" className="repo-error">{error}</div>}
    <fieldset disabled={busy} inert={busy} className="repo-edit-area">{device && metadata}
    {setup && <>
      <nav className="repo-tabs" aria-label="Vista del setup">{(['overview', 'tracks', 'hardware', 'diagram', 'settings'] as const).map(v => <button key={v} aria-pressed={view === v} onClick={() => onNavigate({ ...location, view: v })}>
        {{ overview: 'Conexiones', tracks: 'Pistas', diagram: 'Cableado libre', hardware: 'Panel Hapax', settings: 'Ajustes' }[v]}</button>)}<span>{setup.tracks.length} / 16 pistas</span>
        {view === 'tracks' && <button className="repo-add" disabled={setup.tracks.length >= 16 || busy} onClick={addTrack}><Plus size={16} />Añadir pista</button>}
      </nav>
      {view === 'settings' && metadata}
      {view === 'overview' && <RoutingMap setup={setup} devices={library.devices} onEditTrack={number => onNavigate({ ...location, track: number, view: 'tracks' })} />}
      {view === 'tracks' && <>{focusedTrack > 0 && !setup.tracks.some(t => t.number === focusedTrack) && <p className="repo-routing-notes" role="status">La pista {focusedTrack} no existe en la configuración guardada de este setup.</p>}<TrackList setup={setup} library={library} focusedTrack={focusedTrack} onFocusTrack={number => onNavigate({ ...location, track: number })} onChange={changeTracks} onDefinition={setDefinition} /></>}
      {view === 'diagram' && <Suspense fallback={<p className="oconfig-cable-help">Abriendo cableado…</p>}><RepositoryCableEditor setup={setup} library={library} onChange={edit} /></Suspense>}
      {view === 'hardware' && <section className="repo-hardware">
        <div className="repo-hardware-toolbar">
          <label>Asignar salida a<select aria-label="Pista para asignar salida" value={hardwareTrack} onChange={e => setHardwareTrack(Number(e.target.value))}>
            <option value={0}>Solo inspeccionar</option>{setup.tracks.map(t => <option key={t.number} value={t.number}>{t.number}. {t.name}</option>)}
          </select></label></div>
        <HapaxHardware view="both" activePorts={setup.tracks.map(t => t.port)} selectedPort={focusedPort} onPortClick={p => {
          onNavigate({ ...location, port: p }); if (hardwareTrack) changeTracks(setup.tracks.map(t => t.number === hardwareTrack ? { ...t, port: p, channel: p.startsWith('CV') || p.startsWith('G') ? 0 : t.channel || 1 } : t));
        }} />
        <p className="repo-muted repo-panel-reference">Pantallas y pads: referencia del modo Step. Bordes de color: salidas configuradas en el setup.</p>
        {focusedPort && <p>{portLabel(focusedPort)} · {setup.tracks.filter(t => t.port === focusedPort || ((focusedPort.startsWith('CV') || focusedPort.startsWith('G')) && t.port === `CVG${focusedPort.slice(-1)}`)).map(t => `${t.number}. ${t.name}`).join(', ') || 'Sin pistas asignadas'}</p>}
        <p className="repo-muted">Selecciona una pista y pulsa una salida para asignarla. Para una pareja CV/Gate, elige CV/Gate en Pistas.</p>
        {pendingTracks.length > 0 && <div className="repo-hardware-empty">
          <p>{pendingTracks.length} {pendingTracks.length === 1 ? 'pista no tiene' : 'pistas no tienen'} salida asignada. {configuredRoutes.length ? 'Solo se muestran los recorridos ya configurados.' : 'Por eso este panel todavía no muestra recorridos hacia los equipos.'}</p>
          <button onClick={() => onNavigate({ ...location, view: 'tracks', track: pendingTracks[0].number })}>Asignar salidas en Pistas</button>
        </div>}
        {configuredRoutes.length > 0 && <ul className="repo-panel-routes" aria-label="Recorridos configurados">{configuredRoutes.map(r => <li key={`${r.port}:${r.device}`}>
          <strong>{r.label}</strong><span>→ {r.title}</span><span>{r.tracks.map(t => `${t.number}. ${t.name}`).join(' · ')}</span>
          <button onClick={() => onNavigate({ ...location, view: 'tracks', track: r.tracks[0].number })}>Editar pistas</button>
        </li>)}</ul>}
      </section>}
      {!!warnings.length && <details className="repo-routing-notes"><summary>{warnings.length} puntos de routing por revisar</summary><ul>{warnings.map(w => <li key={w}>{w}</li>)}</ul></details>}
      <footer className="repo-record-footer">{base.path}<span>{library.songs.filter(s => s.setup === setup.id).map(s => `${s.title} · ${s.bpm} BPM`).join(' · ')}</span></footer>
    </>}
    {device && <section className="repo-device-form"><label>Firmware registrado<input value={device.firmware} maxLength={256} onChange={e => edit({ ...device, firmware: e.target.value })} /></label>
      <label>Tipo de equipo<input value={device.kind} maxLength={256} onChange={e => edit({ ...device, kind: e.target.value })} /></label>
      <label>Estado registrado<input value={device.status} maxLength={256} onChange={e => edit({ ...device, status: e.target.value })} /></label>
      <label className="repo-wide">Notas<textarea rows={7} maxLength={10000} value={device.notes || ''} onChange={e => edit({ ...device, notes: e.target.value })} /></label>
      <div className="repo-wide"><h2>Usado en</h2><ul>{library.setups.filter(s => s.tracks.some(t => t.device === device.id)).map(s => <li key={s.id}>{s.title} · {s.tracks.filter(t => t.device === device.id).map(t => `pista ${t.number}`).join(', ')}</li>)}</ul></div>
      <p className="repo-record-footer repo-wide">{base.path}</p>
    </section>}
    </fieldset>{definition && <DefinitionDialog key={definition} name={definition} onClose={() => setDefinition(null)} />}
  </main>;
}

export function RepositoryWorkspace() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(() => !!new URLSearchParams(window.location.search).get('device'));
  const dirty = useRef(false);
  const { location, navigate, pending, cancel, discard } = useWorkspaceNavigation(dirty);
  const selection = selectionFor(location);
  const onDirty = useCallback((value: boolean) => { dirty.current = value; }, []);
  useEffect(() => { let active = true; request<Library>('library').then(r => {
    if (active) setLibrary(r);
  }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  const select = (next: Selection | null, track = 0) => {
    navigate(openLocation(next, location, track)); setLibraryOpen(false);
    if (next?.category === 'devices') setEquipmentOpen(true);
  };
  const onSaved = useCallback((s: Selection, record: Setup | Device) => setLibrary(old => old ? { ...old,
    devices: s.category === 'devices' ? old.devices.map(d => d.id === s.id ? record as Device : d) : old.devices,
    setups: s.category === 'setups' ? old.setups.map(d => d.id === s.id ? record as Setup : d) : old.setups } : old), []);
  if (!library) return <div className="repo-workspace"><main className="repo-start"><div className="repo-brand"><img src="/oconfig.svg" width="32" height="32" alt="" /><h1>Hapax Oconfig</h1></div>
    <p role={error ? 'alert' : 'status'}>{error || 'Abriendo la biblioteca del repo…'}</p>
    {error && <button onClick={() => window.location.reload()}>Reintentar</button>}
  </main></div>;
  const unknown = selection?.category === 'devices'
    ? !library.devices.some(d => d.id === selection.id) ? `No existe el equipo «${selection.id}» en esta biblioteca.` : ''
    : (location.view !== 'home' || library.setups.length > 0) && !library.setups.some(s => s.id === location.setup) ? `No existe el setup «${location.setup}» en esta biblioteca.` : '';
  return <div className="repo-workspace"><aside className={`repo-sidebar${libraryOpen ? ' library-open' : ''}`}><div className="repo-brand"><img src="/oconfig.svg" width="32" height="32" alt="" /><h1>Hapax Oconfig</h1></div>
    <button className="repo-mobile-library" aria-expanded={libraryOpen} aria-controls="repo-library" onClick={() => setLibraryOpen(!libraryOpen)}>Biblioteca</button>
    <input type="search" aria-label="Buscar en biblioteca" placeholder="Buscar equipo o setup" value={query} onChange={e => setQuery(e.target.value)} />
    <nav id="repo-library" aria-label="Biblioteca"><button className="repo-home-link" aria-current={!selection ? 'page' : undefined} onClick={() => select(null)}><Home size={18} aria-hidden="true" />Inicio</button>
      {(['setups', 'devices'] as const).map(category => <section key={category}><h2>{category === 'setups' ? 'Setups' : <button className="repo-section-toggle" aria-expanded={equipmentOpen || !!query} aria-controls="repo-devices" onClick={() => setEquipmentOpen(!equipmentOpen)}>Equipos<span>{library.devices.length}</span><ChevronDown size={16} aria-hidden="true" /></button>}</h2>
      <div id={`repo-${category}`} hidden={category === 'devices' && !equipmentOpen && !query}>
      {library[category].filter(item => `${item.title} ${item.id}`.toLowerCase().includes(query.toLowerCase())).map(item => <button key={item.id}
        aria-current={selection?.category === category && selection.id === item.id ? 'page' : undefined} onClick={() => select({ category, id: item.id })}>
        <span>{item.title}</span><small>{category === 'setups' ? `${(item as Setup).tracks.length} pistas` : item.id}</small>
      </button>)}</div></section>)}</nav>
  </aside>{unknown ? <main className="repo-content repo-start"><p role="alert">{unknown}</p><button onClick={() => navigate({ ...openLocation(null, location), setup: library.setups[0]?.id || 'studio' })}>Ir al inicio</button></main> : selection ? <Editor key={`${selection.category}:${selection.id}`} selection={selection} library={library} location={location} onNavigate={navigate} onSaved={onSaved} onDirty={onDirty} /> : <RepositoryHome library={library} setupId={location.setup} onSetupChange={setup => navigate({ ...location, setup })} onOpen={select} />}
    {pending && <Dialog title="Cambios sin guardar" onClose={cancel}>
      <h2 id="unsaved-title">Cambios sin guardar</h2><p>Guarda la ficha actual para conservar los cambios antes de abrir otra.</p>
      <div><button autoFocus onClick={cancel}>Seguir editando</button><button onClick={discard}>Descartar y cambiar</button></div>
    </Dialog>}
  </div>;
}
