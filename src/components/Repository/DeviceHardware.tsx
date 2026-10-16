import type { CSSProperties } from 'react';
import { HapaxHardware } from './HapaxHardware';
import { HARDWARE_ASPECT_RATIOS, hardwareAssetUrl, hardwareVisual } from './hardwareVisuals';

export function DeviceHardware({ id, title, compact = false }: { id: string; title?: string; compact?: boolean }) {
  const visual = hardwareVisual(id);
  if (!visual) return <div className="device-hardware-missing">Vista de {title || id} pendiente de documentar</div>;
  return <div className={`device-hardware${compact ? ' device-hardware-compact' : ''}`} data-hardware-id={id}
    style={{ '--hardware-aspect-ratio': HARDWARE_ASPECT_RATIOS[visual.asset || id] } as CSSProperties}>
    {id === 'hapax' ? <HapaxHardware view="top" compact panelOnly />
      : <img src={hardwareAssetUrl(visual.asset!)} alt={`${title || visual.model} · vista superior esquemática`} loading="lazy" decoding="async" />}
  </div>;
}

export function DeviceHardwareFigure({ id, title }: { id: string; title: string }) {
  const visual = hardwareVisual(id);
  return <figure className="device-hardware-figure">
    <DeviceHardware id={id} title={title} />
    <figcaption>Vista superior · referencia esquemática{visual && <> · <a href={visual.source} target="_blank" rel="noreferrer">Referencia del fabricante</a>
      {visual.asset && <> · <a href={hardwareAssetUrl(visual.asset)} download={`${visual.asset}.svg`}>Descargar SVG</a></>}</>}
      {visual?.note && <span>{visual.note}</span>}
    </figcaption>
  </figure>;
}
