import catalogue from '../../../public/hardware/panels.json';
import type { InstrumentNodeData, Port, PortType, StudioEdge } from '../../types';
import type { Connection, Node } from '@xyflow/react';
import { nodeHardwareId } from './hardwareVisuals';

export type HardwareFace = 'top' | 'rear' | 'front' | 'left' | 'right';
export type PhysicalConnector = {
  id: string; label: string; face: HardwareFace; x: number; y: number;
  kind: string; signal: PortType | 'power' | 'storage' | 'control' | 'mechanical';
  direction: 'input' | 'output' | 'duplex' | 'none'; detail: string;
  usbRole?: 'host' | 'device' | 'dual';
};
export type HardwareFaceView = { width: number; height: number; label: string; note: string; asset: string };
export type HardwarePanel = {
  name: string; defaultFace: HardwareFace; faces: Partial<Record<HardwareFace, HardwareFaceView>>;
  connectors: PhysicalConnector[]; sources: { title: string; url: string }[]; note: string;
};
const models = catalogue.models as unknown as Record<string, HardwarePanel>;
const aliases: Record<string, string> = catalogue.aliases;
export function hardwarePanel(id: string): HardwarePanel | undefined {
  const modelId = Object.hasOwn(aliases, id) ? aliases[id] : id;
  return Object.hasOwn(models, modelId) ? models[modelId] : undefined;
}
export function panelFace(panel: HardwarePanel, requested?: string): HardwareFace {
  return requested && Object.hasOwn(panel.faces, requested) ? requested as HardwareFace : panel.defaultFace;
}
export const isSignalConnector = (c: PhysicalConnector): c is PhysicalConnector & { signal: PortType } =>
  ['midi', 'audio', 'cv', 'usb'].includes(c.signal);

/** One physical USB receptacle, two directional graph handles. No DC/SD/pedal cables. */
export function physicalPorts(id: string): { inputs: Port[]; outputs: Port[] } {
  const panel = hardwarePanel(id);
  const inputs: Port[] = [], outputs: Port[] = [];
  panel?.connectors.filter(isSignalConnector).forEach(c => {
    const port = { connectorId: c.id, label: c.label, type: c.signal };
    if (c.direction === 'input' || c.direction === 'duplex') inputs.push({ ...port, id: `physical:${c.id}:in` });
    if (c.direction === 'output' || c.direction === 'duplex') outputs.push({ ...port, id: `physical:${c.id}:out` });
  });
  return { inputs, outputs };
}

/** Keep every saved handle. Only bind an old port when both candidates are unique. */
export function enrichPhysicalPorts(id: string, existing: { inputs: Port[]; outputs: Port[] }) {
  const cataloguePorts = physicalPorts(id);
  const enrich = (old: Port[], real: Port[]) => {
    const used = new Set(old.map(p => p.connectorId).filter(Boolean));
    const result = old.map(p => {
      if (p.connectorId) return p;
      const candidates = real.filter(r => !used.has(r.connectorId) && r.type === p.type);
      const oldOfType = old.filter(o => !o.connectorId && o.type === p.type);
      if (candidates.length === 1 && oldOfType.length === 1) {
        used.add(candidates[0].connectorId);
        return { ...p, connectorId: candidates[0].connectorId };
      }
      return p;
    });
    return [...result, ...real.filter(p => !used.has(p.connectorId))];
  };
  return { inputs: enrich(existing.inputs, cataloguePorts.inputs), outputs: enrich(existing.outputs, cataloguePorts.outputs) };
}

export function connectorForPort(panel: HardwarePanel, port: Port, direction: 'input' | 'output') {
  return panel.connectors.find(c => c.id === port.connectorId && isSignalConnector(c) && c.signal === port.type
    && (c.direction === direction || c.direction === 'duplex'));
}

export function usbRoleForPort(hardwareId: string, port: Port) {
  const panel = hardwarePanel(hardwareId);
  return panel?.connectors.find(c => c.id === port.connectorId || (hardwareId === 'hapax' && c.id === port.id))?.usbRole;
}

/** Known USB sockets require a host. Generic legacy ports keep their existing behavior. */
export function physicalPortsCompatible(sourceHardwareId: string, source: Port, targetHardwareId: string, target: Port) {
  if (source.type !== target.type) return false;
  if (source.type !== 'usb') return true;
  const a = usbRoleForPort(sourceHardwareId, source), b = usbRoleForPort(targetHardwareId, target);
  return !a || !b || a === 'dual' || b === 'dual' || a !== b;
}

/** Two graph directions on a USB socket still accept only one physical cable. */
export function conflictingUsbEdges(nodes: Node<InstrumentNodeData>[], edges: StudioEdge[], connection: Connection): string[] {
  const endpoints = ([['source', 'sourceHandle', 'outputs'], ['target', 'targetHandle', 'inputs']] as const).flatMap(([nodeKey, handleKey, portsKey]) => {
    const node = nodes.find(n => n.id === connection[nodeKey]);
    const port = node?.data[portsKey].find(p => p.id === connection[handleKey]);
    if (!node || !port || port.type !== 'usb') return [];
    const hardwareId = nodeHardwareId(node.id, node.data);
    const socket = port.connectorId || (hardwareId === 'hapax' ? port.id : undefined);
    return socket ? [{ node, socket, hardwareId }] : [];
  });
  return edges.filter(edge => endpoints.some(({ node, socket, hardwareId }) =>
    ([['source', 'sourceHandle', 'outputs'], ['target', 'targetHandle', 'inputs']] as const).some(([nodeKey, handleKey, portsKey]) => {
      if (edge[nodeKey] !== node.id) return false;
      const port = node.data[portsKey].find(p => p.id === edge[handleKey]);
      return port?.type === 'usb' && (port.connectorId || (hardwareId === 'hapax' ? port.id : undefined)) === socket;
    })
  )).map(e => e.id);
}

/** Binding never changes an ID/edge. Ambiguous legacy handles remain visible in a rail. */
export function bindExistingPorts(id: string, existing: { inputs: Port[]; outputs: Port[] }) {
  const enriched = enrichPhysicalPorts(id, existing);
  return { inputs: enriched.inputs.slice(0, existing.inputs.length), outputs: enriched.outputs.slice(0, existing.outputs.length) };
}
