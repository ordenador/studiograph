import { useState, type CSSProperties } from 'react';
import { HapaxHardware } from './HapaxHardware';
import { HARDWARE_ASPECT_RATIOS, hardwareAssetUrl, hardwareVisual } from './hardwareVisuals';
import { hardwarePanel, type HardwareFace } from './hardwarePanels';
import './hardwarePanels.css';

const signalLabels = { audio: 'Audio', midi: 'MIDI', cv: 'CV / Gate', usb: 'USB', power: 'Alimentación', storage: 'Tarjeta', control: 'Pedal', mechanical: 'Mecánico' };
const directionLabels = { input: 'entrada', output: 'salida', duplex: 'bidireccional', none: '' };

export function DeviceHardware({ id, title, compact = false, view = 'top' }: { id: string; title?: string; compact?: boolean; view?: HardwareFace }) {
  const visual = hardwareVisual(id);
  const panel = hardwarePanel(id);
  const face = panel?.faces[view];
  if (!visual) return <div className="device-hardware-missing">Vista de {title || id} pendiente de documentar</div>;
  return <div className={`device-hardware${compact ? ' device-hardware-compact' : ''}`} data-hardware-id={id}
    data-hardware-face={view} style={{ '--hardware-aspect-ratio': face ? `${face.width} / ${face.height}` : HARDWARE_ASPECT_RATIOS[visual.asset || id] } as CSSProperties}>
    {id === 'hapax' ? <HapaxHardware view={view === 'rear' ? 'rear' : 'top'} compact panelOnly />
      : <img src={hardwareAssetUrl(face?.asset || visual.asset!)} alt={`${title || visual.model} · ${face?.label || 'vista superior'} esquemática`} loading="lazy" decoding="async" />}
  </div>;
}

export function DeviceHardwareFigure({ id, title }: { id: string; title: string }) {
  const visual = hardwareVisual(id);
  const [requestedView, setView] = useState<HardwareFace>('top');
  const panel = hardwarePanel(id);
  const view = requestedView === 'top' || panel?.faces[requestedView] ? requestedView : 'top';
  const face = panel?.faces[view];
  const asset = face?.asset || (view === 'top' ? visual?.asset : undefined);
  return <figure className="device-hardware-figure">
    {panel && <div className="hardware-face-toolbar"><label>Vista <select value={view} onChange={e => setView(e.target.value as HardwareFace)} aria-label={`Vista de ${title}`}>
      <option value="top">Superior</option>{Object.entries(panel.faces).filter(([side]) => side !== 'top').map(([side, f]) => <option key={side} value={side}>{f.label}</option>)}
    </select></label></div>}
    <DeviceHardware id={id} title={title} view={view} />
    <figcaption>{face?.label || 'Vista superior'} · referencia esquemática{visual && <> · <a href={face ? panel!.sources[0].url : visual.source} target="_blank" rel="noreferrer">Referencia del fabricante</a>
      {asset && <> · <a href={hardwareAssetUrl(asset)} download={`${asset}.svg`}>Descargar SVG</a></>}</>}
      {face?.note && <span>{face.note}</span>}
      {visual?.note && <span>{visual.note}</span>}
    </figcaption>
    {panel && <details className="hardware-connectors"><summary>Conectores físicos · {panel.connectors.length}</summary>
      <p><a href={`${import.meta.env.BASE_URL}hardware/panels.json`} download="hardware-panels.json">Descargar catálogo JSON</a></p>
      <div className="hardware-connectors-scroll"><table><thead><tr><th>Conector</th><th>Cara</th><th>Función</th><th>Detalle</th></tr></thead><tbody>
        {panel.connectors.map(c => <tr key={c.id}><td>{c.label}</td><td>{panel.faces[c.face]?.label}</td><td>{signalLabels[c.signal]}{directionLabels[c.direction] && ` · ${directionLabels[c.direction]}`}</td><td>{c.detail || '—'}</td></tr>)}
      </tbody></table></div>
      <p>{panel.note}</p>
    </details>}
  </figure>;
}
