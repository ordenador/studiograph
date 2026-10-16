import { useEffect } from 'react';
import { Handle, NodeResizer, Position, useUpdateNodeInternals, type Node, type NodeProps } from '@xyflow/react';
import { HapaxHardware } from '../Repository/HapaxHardware';
import { CONNECTORS, hapaxHandlePort } from '../Repository/hardwareConnectors';
import { EDGE_COLORS } from '../../data/defaultNodes';
import { useStudioStore } from '../../store/useStudioStore';
import type { InstrumentNodeData, Port } from '../../types';

export function HapaxRearNode({ id, data }: NodeProps<Node<InstrumentNodeData>>) {
  const selected = useStudioStore(s => s.selectedNodeId === id);
  const edges = useStudioStore(s => s.edges);
  const select = useStudioStore(s => s.setSelectedNode);
  const updateWidth = useStudioStore(s => s.updateNodeWidth);
  const internals = useUpdateNodeInternals();
  const width = Math.max(900, data.width || 1000);
  useEffect(() => { internals(id); }, [internals, id, width, data.showCVPorts]);
  const visible = (port: Port) => port.type !== 'cv' || data.showCVPorts;
  const activePorts = edges.filter(e => e.source === id).map(e => hapaxHandlePort(e.sourceHandle || ''));
  const inputX = Object.fromEntries(CONNECTORS.filter(c => c.input).map(c => [c.input!, c.x]));
  const handle = (port: Port, direction: 'source' | 'target') => {
    const x = direction === 'source' ? CONNECTORS.find(c => c.port === hapaxHandlePort(port.id))?.x : inputX[port.id];
    if (x === undefined || !visible(port)) return null;
    return <Handle key={`${direction}:${port.id}`} id={port.id} type={direction} position={direction === 'source' ? Position.Bottom : Position.Top}
      className="hapax-patch-handle" title={`${port.label} · ${direction === 'source' ? 'salida' : 'entrada'}`}
      style={{ left: `${x / 10}%`, top: direction === 'source' ? '100%' : '0%', background: EDGE_COLORS[port.type] }} />;
  };
  return <div className={`oconfig-hapax-rear${selected ? ' is-selected' : ''}`} style={{ width }} onClick={() => select(id)}>
    <NodeResizer isVisible={selected} minWidth={900} minHeight={171} keepAspectRatio onResizeEnd={(_, p) => updateWidth(id, p.width)} />
    <HapaxHardware patchbay activePorts={activePorts} patchInputs={data.inputs.filter(visible).map(p => inputX[p.id]).filter(x => x !== undefined)} />
    <button className="nodrag oconfig-hapax-edit" onClick={() => select(id)} aria-label="Editar Hapax en el cableado">Hapax</button>
    {data.inputs.map(p => handle(p, 'target'))}
    {data.outputs.map(p => handle(p, 'source'))}
  </div>;
}
