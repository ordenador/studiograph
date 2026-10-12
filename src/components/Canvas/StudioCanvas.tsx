import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Connection,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  useReactFlow,
  useNodesInitialized,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStudioStore } from '../../store/useStudioStore';
import { InstrumentNode } from '../Nodes/InstrumentNode';
import { HapaxRearNode } from '../Nodes/HapaxRearNode';
import { CustomEdge } from './CustomEdge';
import type { InstrumentPreset, InstrumentNodeData } from '../../types';
import { EDGE_COLORS } from '../../data/defaultNodes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReactFlow NodeTypes variance requires this cast
const nodeTypes: NodeTypes = { instrument: InstrumentNode as any, hapaxRear: HapaxRearNode as any };

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

function StudioCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const initialized = useNodesInitialized();
  useEffect(() => {
    if (!initialized || !reactFlowWrapper.current) return;
    const observer = new ResizeObserver(() => { void fitView({ padding: 0.12 }); });
    observer.observe(reactFlowWrapper.current);
    return () => observer.disconnect();
  }, [fitView, initialized]);

  const {
    nodes,
    edges,
    hasLoop,
    loopEdges,
    addEdge,
    removeEdge,
    onNodesChange,
    onEdgesChange,
    addNode,
    setSelectedNode,
  } = useStudioStore();

  // Validate connection: check port types match
  const isValidConnection = useCallback(
    (connection: Pick<Connection, 'source' | 'target'> & { sourceHandle?: string | null; targetHandle?: string | null }) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target || !sourceHandle || !targetHandle) return false;

      // Prevent self-connections
      if (source === target) return false;

      // Find the source and target nodes
      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);
      if (!sourceNode || !targetNode) return false;

      const sourceData = sourceNode.data as InstrumentNodeData;
      const targetData = targetNode.data as InstrumentNodeData;

      // Find the port types
      const sourcePort = sourceData.outputs.find((p) => p.id === sourceHandle);
      const targetPort = targetData.inputs.find((p) => p.id === targetHandle);
      if (!sourcePort || !targetPort) return false;

      // Types must match
      if (sourcePort.type !== targetPort.type) return false;

      // Allow cycles - just show warning, don't block
      // (MIDI feedback loops are sometimes intentional for recording/thru setups)

      return true;
    },
    [nodes]
  );

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target || !sourceHandle || !targetHandle) return;

      // Find the port type
      const sourceNode = nodes.find((n) => n.id === source);
      if (!sourceNode) return;

      const sourceData = sourceNode.data as InstrumentNodeData;
      const sourcePort = sourceData.outputs.find((p) => p.id === sourceHandle);
      if (!sourcePort) return;

      // Remove any existing connection to this target handle (replace behavior)
      const existingTargetEdge = edges.find(
        (e) => e.target === target && e.targetHandle === targetHandle
      );
      if (existingTargetEdge) {
        removeEdge(existingTargetEdge.id);
      }

      // One-cable-per-output: MIDI, CV, and USB outputs can only drive one input
      if (sourcePort.type === 'midi' || sourcePort.type === 'cv' || sourcePort.type === 'usb') {
        const existingSourceEdge = edges.find(
          (e) => e.source === source && e.sourceHandle === sourceHandle
        );
        if (existingSourceEdge) {
          removeEdge(existingSourceEdge.id);
        }
      }

      addEdge(connection, sourcePort.type);
    },
    [nodes, edges, addEdge, removeEdge]
  );

  // Handle drag over for dropping new nodes
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop for creating new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const presetData = event.dataTransfer.getData('application/hapax-oconfig-preset');
      if (!presetData) return;

      let preset: InstrumentPreset;
      try { preset = JSON.parse(presetData); } catch { return; }
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(preset, position);
    },
    [screenToFlowPosition, addNode]
  );

  // Deselect when clicking canvas background
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Compute routing offsets and style edges
  const styledEdges = useMemo(() => {
    // Group edges by source node to assign incremental offsets
    const bySource = new Map<string, typeof edges>();
    for (const edge of edges) {
      const group = bySource.get(edge.source) || [];
      group.push(edge);
      bySource.set(edge.source, group);
    }

    const edgeOffsets = new Map<string, number>();
    for (const group of bySource.values()) {
      const count = group.length;
      for (let i = 0; i < count; i++) {
        // Incremental positive offsets: e.g. for 3 edges → 0, 12, 24
        edgeOffsets.set(group[i].id, i * 12);
      }
    }

    const hapax = nodes.find(n => n.data.isHapax);
    const receivers = nodes.filter(n => !n.data.isHapax);
    const left = Math.min(...receivers.map(n => n.position.x), hapax?.position.x || 0) - 50;
    const right = Math.max(...receivers.map(n => n.position.x + (n.measured?.width || n.data.width || 260)), (hapax?.position.x || 0) + Math.max(900, hapax?.data.width || 1000)) + 50;
    return edges.map((edge) => {
      const target = nodes.find(n => n.id === edge.target);
      const laterRow = hapax && edge.source === hapax.id && target && target.position.y > hapax.position.y + 550;
      return ({
      ...edge,
      style: { stroke: EDGE_COLORS[edge.data?.portType || 'midi'], strokeWidth: 2 },
      data: {
        ...edge.data,
        routingOffset: edgeOffsets.get(edge.id) || 0,
        ...(laterRow ? { corridorX: target.position.x < (left + right) / 2 ? left : right } : {}),
      },
      className: loopEdges.includes(edge.id) ? 'loop-edge' : '',
      animated: false,
    }); });
  }, [edges, loopEdges, nodes]);

  return (
    <div ref={reactFlowWrapper} className="oconfig-canvas flex-1 h-full">
      <ReactFlow
        nodes={nodes.map(n => ({ ...n, type: n.data.isHapax ? 'hapaxRear' : 'instrument' })) as Node[]}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.1}
        colorMode="dark"
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={{
          type: 'custom',
        }}
      >
        <Background color="#374151" gap={20} />
        <Controls className="!bg-gray-800 !border-gray-600" />
      </ReactFlow>

      {/* Loop Warning Toast */}
      {hasLoop && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <span className="font-semibold" role="alert">Bucle MIDI detectado · Revisa el retorno o activa Local Off</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudioCanvas() {
  return (
    <ReactFlowProvider>
      <StudioCanvasInner />
    </ReactFlowProvider>
  );
}
