import { useEffect, useRef, useState } from 'react';
import { EquipmentLibrary } from '../Sidebar/Sidebar';
import { StudioCanvas } from '../Canvas/StudioCanvas';
import { NodeEditor } from '../Panels/NodeEditor';
import { useStudioStore } from '../../store/useStudioStore';
import { exportAllDefinitions } from '../../utils/hapaxExport';
import { applyWorkspaceRoutes, autoArrangeWorkspace, durableWorkspace, equipmentPreset, legacyWorkspace, readWorkspace, seedWorkspace, trackSignature, type CableWorkspace } from './cableWorkspace';
import { request, type Library, type Setup } from './repository';

const previousWorkspace = legacyWorkspace();

export function RepositoryCableEditor({ setup, library, onChange }: { setup: Setup; library: Library; onChange: (setup: Setup) => void }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState(false);
  const [message, setMessage] = useState('');
  const selected = useStudioStore(s => s.selectedNodeId);
  const current = useRef(setup);
  const callback = useRef(onChange);
  const loaded = useRef('');
  const source = useRef('');
  const signature = trackSignature(setup.tracks);
  useEffect(() => { current.current = setup; callback.current = onChange; });
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const start = async () => {
      try {
        const input = setup.oconfig_workspace || '';
        if (!input || loaded.current !== input) {
          let workspace: CableWorkspace;
          if (input) workspace = readWorkspace(input);
          else {
            const definitions = Object.fromEntries(await Promise.all([...new Set(setup.tracks.map(t => t.definition))].map(async name => {
              const result = await request<{ text: string }>(`definitions/${encodeURIComponent(name)}`);
              return [name, result.text];
            })));
            workspace = seedWorkspace(setup, library.devices, definitions);
          }
          if (!active) return;
          source.current = workspace.sourceTracks || '';
          useStudioStore.getState().importStudio(workspace.nodes, workspace.edges, workspace.customPresets);
          loaded.current = JSON.stringify(durableWorkspace(workspace));
        }
        if (!active) return;
        setReady(true); setError('');
        unsubscribe = useStudioStore.subscribe(state => {
          // React Flow measurements/selection are transient; dragging is saved once it ends.
          if (state.nodes.some(n => n.dragging)) return;
          const next = JSON.stringify(durableWorkspace({ ...state, version: 1, sourceTracks: source.current }));
          if (next === loaded.current) return;
          loaded.current = next;
          callback.current({ ...current.current, oconfig_workspace: next });
        });
      } catch (e) { if (active) { setReady(false); setError(e instanceof Error ? e.message : 'No se pudo abrir el cableado.'); } }
    };
    void start();
    return () => { active = false; unsubscribe?.(); };
    // The immutable signature tracks canonical edits without resetting the live graph on selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup.id, setup.oconfig_workspace, signature, library.devices]);

  const replaceFromTracks = async () => {
    if (!window.confirm('¿Reconstruir el diseño desde las pistas actuales? Puedes deshacerlo antes de guardar.')) return;
    try {
      const definitions = Object.fromEntries(await Promise.all([...new Set(setup.tracks.map(t => t.definition))].map(async name => [name, (await request<{ text: string }>(`definitions/${encodeURIComponent(name)}`)).text])));
      onChange({ ...setup, oconfig_workspace: JSON.stringify(seedWorkspace(setup, library.devices, definitions)) });
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo reconstruir.'); }
  };
  const apply = () => {
    try {
      const workspace = readWorkspace(loaded.current);
      const tracks = applyWorkspaceRoutes(workspace, setup.tracks);
      source.current = trackSignature(tracks);
      const next = JSON.stringify({ ...workspace, sourceTracks: source.current });
      onChange({ ...setup, tracks, oconfig_workspace: next });
      setError(''); setMessage('Salidas y canales aplicados a Pistas. Guarda en el repo para conservarlos.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron aplicar las salidas.'); }
  };
  const stale = !!source.current && source.current !== signature;
  const catalogPresets = new Map(library.devices.filter(d => d.id !== 'hapax').map(d => {
    const p = equipmentPreset(d); return [p.id, p];
  }));
  for (const other of library.setups.filter(s => s.id !== setup.id && s.oconfig_workspace)) {
    try { for (const preset of readWorkspace(other.oconfig_workspace!).customPresets) if (!catalogPresets.has(preset.id)) catalogPresets.set(preset.id, preset); }
    catch { /* A damaged design cannot prevent opening this setup's catalog. */ }
  }
  return <section className="oconfig-cable-editor" aria-label="Cableado libre del setup">
    <div className="oconfig-cable-actions">
      <button aria-expanded={catalog} onClick={() => setCatalog(!catalog)}>Equipos y catálogo</button>
      <button disabled={!ready} onClick={() => onChange({ ...setup, oconfig_workspace: JSON.stringify(autoArrangeWorkspace(readWorkspace(loaded.current))) })}>Ordenar cableado</button>
      <button disabled={!ready} onClick={() => void replaceFromTracks()}>Reconstruir desde pistas</button>
      <button disabled={!ready} onClick={apply}>Aplicar a pistas</button>
      <button disabled={!ready} onClick={() => {
        const state = useStudioStore.getState();
        const count = exportAllDefinitions(state.nodes, state.edges);
        setMessage(count ? `${count} definiciones TXT descargadas.` : 'Conecta un bloque a Hapax para generar su definición.');
      }}>Descargar definiciones TXT</button>
      {previousWorkspace && <button disabled={!ready} onClick={() => {
        if (window.confirm('¿Recuperar el diseño anterior del navegador en este setup? Puedes deshacer antes de guardar.')) {
          onChange({ ...setup, oconfig_workspace: JSON.stringify(previousWorkspace) });
        }
      }}>Recuperar diseño anterior</button>}
    </div>
    <p className="oconfig-cable-help">Diseña cables MIDI, audio, CV y USB. Selecciona un bloque para editar parámetros. «Aplicar a pistas» copia salidas y canales; «Guardar en repo» conserva todo el diseño.</p>
    {stale && <p className="oconfig-cable-notice" role="status">Las pistas cambiaron desde que se creó este diseño. Revisa ambos antes de aplicar o reconstruye desde las pistas.</p>}
    {message && <p className="oconfig-cable-notice" role="status">{message}</p>}
    {error && <p className="repo-error" role="alert">{error}</p>}
    {!ready ? <p className="oconfig-cable-help">{error ? 'El diseño guardado se conserva. Puedes recargar la ficha para reintentar.' : 'Abriendo cableado y definiciones…'}</p> : <div className="oconfig-cable-body">
      {catalog && <EquipmentLibrary presets={[...catalogPresets.values()]} />}
      <StudioCanvas />
      {selected && <NodeEditor key={selected} />}
    </div>}
  </section>;
}
