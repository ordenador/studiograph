import { ArrowRight, Music2 } from 'lucide-react';
import { RoutingMap } from './RoutingMap';
import { routeWarnings, stateLabel, type Library, type Selection } from './repository';

export function RepositoryHome({ library, setupId, onSetupChange, onOpen }: {
  library: Library; setupId: string; onSetupChange: (id: string) => void;
  onOpen: (selection: Selection, track?: number) => void;
}) {
  const setup = library.setups.find(s => s.id === setupId) || library.setups[0];
  const warnings = setup ? routeWarnings(setup.tracks) : [];
  return <main className="repo-content repo-home">
    <header className="home-header"><h1>Tu estudio</h1><p>Elige un setup y sigue el recorrido desde Hapax hasta cada equipo.</p></header>
    <nav className="home-setups" aria-label="Setup que estás visualizando">{[...library.setups].sort((a, b) => Number(b.id === 'studio') - Number(a.id === 'studio')).map(s => <button key={s.id}
      aria-pressed={setup?.id === s.id} onClick={() => onSetupChange(s.id)}>{s.title}</button>)}</nav>
    {setup ? <>
      <div className="home-setup-heading"><div><h2>{setup.title}</h2><span>{stateLabel(setup.status)}</span></div>
        <button onClick={() => onOpen({ category: 'setups', id: setup.id })}>Editar setup<ArrowRight size={16} aria-hidden="true" /></button>
      </div>
      <RoutingMap key={setup.id} setup={setup} devices={library.devices}
        onEditTrack={track => onOpen({ category: 'setups', id: setup.id }, track)}
        onOpenDevice={id => onOpen({ category: 'devices', id })} />
      {!!warnings.length && <details className="repo-routing-notes"><summary>{warnings.length} asignaciones por revisar</summary><ul>{warnings.map(w => <li key={w}>{w}</li>)}</ul></details>}
      {!!library.songs.filter(s => s.setup === setup.id).length && <section className="home-songs"><h2>Canciones de este setup</h2>
        <ul>{library.songs.filter(s => s.setup === setup.id).map(song => <li key={song.id}><Music2 size={18} aria-hidden="true" /><strong>{song.title}</strong><span>{song.bpm} BPM</span></li>)}</ul>
      </section>}
    </> : <p className="repo-empty">Todavía no hay setups en la biblioteca.</p>}
  </main>;
}
