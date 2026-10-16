import { useEffect } from 'react';
import { Handle, NodeResizer, Position, useUpdateNodeInternals, type Node, type NodeProps } from '@xyflow/react';
import { useStudioStore } from '../../store/useStudioStore';
import type { InstrumentNodeData, Port } from '../../types';
import { EDGE_COLORS } from '../../data/defaultNodes';
import { hardwareAssetUrl, nodeHardwareId } from '../Repository/hardwareVisuals';
import { bindExistingPorts, connectorForPort, enrichPhysicalPorts, hardwarePanel, panelFace, type HardwareFace } from '../Repository/hardwarePanels';
import '../Repository/hardwarePanels.css';

export function HardwarePanelNode({ id, data }: NodeProps<Node<InstrumentNodeData>>) {
  const selected = useStudioStore(s => s.selectedNodeId === id);
  const select = useStudioStore(s => s.setSelectedNode);
  const update = useStudioStore(s => s.updateNodeData);
  const resize = useStudioStore(s => s.updateNodeWidth);
  const remove = useStudioStore(s => s.removeNode);
  const internals = useUpdateNodeInternals();
  const hardwareId = nodeHardwareId(id, data);
  const panel = hardwarePanel(hardwareId)!;
  const side = panelFace(panel, data.hardwareView);
  const face = panel.faces[side]!;
  const width = Math.max(620, data.width || 800);
  const ports = bindExistingPorts(hardwareId, data);
  const augmented = enrichPhysicalPorts(hardwareId, data);
  const missing = augmented.inputs.length + augmented.outputs.length > data.inputs.length + data.outputs.length;
  const signature = JSON.stringify([data.inputs, data.outputs]);
  useEffect(() => { internals(id); }, [internals, id, side, width, signature]);
  const offPanel = (direction: 'input' | 'output') => ports[direction === 'input' ? 'inputs' : 'outputs'].filter(p => connectorForPort(panel, p, direction)?.face !== side);
  const handle = (port: Port, direction: 'input' | 'output', physical = false) => {
    const c = connectorForPort(panel, port, direction);
    const duplexOffset = c?.direction === 'duplex' ? direction === 'input' ? -10 : 10 : 0;
    return <Handle id={port.id} type={direction === 'input' ? 'target' : 'source'} position={direction === 'input' ? Position.Top : Position.Bottom}
      title={`${c?.label || port.label} · ${direction === 'input' ? 'entrada' : 'salida'}${c ? ` · ${c.detail}` : ' · puerto guardado sin correspondencia física'}`}
      className="hardware-patch-handle" style={{ background: EDGE_COLORS[port.type], ...(physical && c ? { left: `${c.x / face.width * 100}%`, top: `calc(${c.y / face.height * 100}% + ${duplexOffset}px)`, transform: 'translate(-50%, -50%)' } : {}) }} />;
  };
  const rail = (direction: 'input' | 'output') => {
    const off = offPanel(direction);
    return off.length > 0 && <div className={`hardware-port-rail hardware-port-rail-${direction}`}>
      {off.map(p => {
        const c = connectorForPort(panel, p, direction);
        return <div key={p.id} className="hardware-port-rail-item">{handle(p, direction)}<span>{c?.label || p.label}</span>
          <small>{c ? panel.faces[c.face]?.label : 'Sin correspondencia física'}</small></div>;
      })}
    </div>;
  };
  return <div className={`hardware-panel-node${selected ? ' is-selected' : ''}`} style={{ width }} onClick={e => {
    if (!(e.target as Element).closest('select, button, .react-flow__handle')) select(id);
  }} data-hardware-id={hardwareId}>
    <NodeResizer isVisible={selected} minWidth={620} keepAspectRatio onResizeEnd={(_, size) => resize(id, size.width)} />
    <div className="hardware-panel-node-toolbar"><button className="nodrag" onClick={() => select(id)} title="Editar equipo">{data.name}</button>
      <label className="nodrag">Vista <select aria-label={`Vista de ${data.name}`} value={side} onChange={e => update(id, { hardwareView: e.target.value as HardwareFace })}>
        {Object.entries(panel.faces).map(([side, f]) => <option key={side} value={side}>{f.label}</option>)}
      </select></label>
      {data.isRemovable !== false && <button className="nodrag" onClick={() => remove(id)} aria-label={`Quitar ${data.name}`}>×</button>}
    </div>
    {rail('input')}
    <div className="hardware-panel-node-image" style={{ aspectRatio: `${face.width} / ${face.height}` }}>
      <img src={hardwareAssetUrl(face.asset)} alt={`${panel.name} · ${face.label}`} draggable={false} />
      {(['input', 'output'] as const).flatMap(direction => ports[direction === 'input' ? 'inputs' : 'outputs'].map(p => connectorForPort(panel, p, direction)?.face === side
        ? <span key={`${direction}:${p.id}`}>{handle(p, direction, true)}</span> : null))}
    </div>
    {rail('output')}
    {(missing || face.note || typeof data.hardwareRouteWarning === 'string') && <div className="hardware-panel-node-footer">
      {face.note && <span>{face.note}</span>}
      {typeof data.hardwareRouteWarning === 'string' && <span>{data.hardwareRouteWarning}</span>}
      {missing && <button className="nodrag" onClick={() => update(id, augmented)}>Añadir conectores del catálogo</button>}
    </div>}
  </div>;
}
