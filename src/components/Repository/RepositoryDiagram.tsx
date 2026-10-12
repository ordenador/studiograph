import { useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position, useNodesState, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Device, Layout, Setup } from './repository';
import { portLabel } from './repository';

import { buildDiagram, type DeviceNode } from './diagramModel';

function PhysicalDevice({ data }: NodeProps<DeviceNode>) {
  const ports = [...new Set(data.tracks.map(t => t.port).filter(p => p !== 'NULL'))];
  return <div className="repo-node">
    <strong>{data.title}</strong>
    {data.hapax ? <div className="repo-output-list">{ports.map((p, i) => <div key={p}>
      <span>{portLabel(p)}</span><Handle type="source" position={Position.Right} id={p}
        style={{ top: 58 + i * 26 }} isConnectable={false} />
    </div>)}</div> : <>
      <p>Firmware: {data.firmware === 'unknown' ? 'Sin registrar' : data.firmware}</p>
      {ports.map((p, i) => <Handle key={p} type="target" position={Position.Left} id={p}
        style={{ top: 45 + i * 20 }} isConnectable={false} />)}
      <ul>{data.tracks.map(t => <li key={t.number}><span>{t.number}. {t.name}</span>
        <small>{portLabel(t.port)}{t.channel > 0 ? ` · CH ${t.channel}` : ''}</small></li>)}</ul>
    </>}
  </div>;
}
const nodeTypes = { repositoryDevice: PhysicalDevice };


export function RepositoryDiagram({ setup, devices, onLayout }: { setup: Setup; devices: Device[]; onLayout: (layout: Layout) => void }) {
  const graph = useMemo(() => buildDiagram(setup, devices), [setup, devices]);
  const [previousGraph, setPreviousGraph] = useState(graph);
  const [nodes, setNodes, onNodesChange] = useNodesState<DeviceNode>(graph.nodes);
  // Sync external edits/undo while retaining React Flow's measured dimensions.
  if (previousGraph !== graph) {
    setPreviousGraph(graph);
    setNodes(old => graph.nodes.map(n => ({ ...old.find(item => item.id === n.id), ...n })));
  }
  return <div className="repo-diagram"><ReactFlowProvider><ReactFlow nodes={nodes} edges={graph.edges} nodeTypes={nodeTypes}
    onNodesChange={onNodesChange}
    onNodeDragStop={(_, node) => onLayout({ ...(setup.studio_layout || {}), [node.id]: node.position })}
    nodesConnectable={false} edgesFocusable={false} deleteKeyCode={null} fitView fitViewOptions={{ padding: .15 }} minZoom={.2} maxZoom={1.4} colorMode="dark">
    <Background color="#374151" gap={24} /><Controls showInteractive={false} />
  </ReactFlow></ReactFlowProvider><p className="repo-diagram-note">Un nodo por equipo · Arrastra para ordenar · Edita las conexiones en Pistas</p></div>;
}
