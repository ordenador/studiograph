import type { Node } from '@xyflow/react';
import { HAPAX_PRESET } from '../../data/defaultNodes';
import type { InstrumentNodeData, InstrumentPreset, Port, StudioEdge, AutomationLane } from '../../types';
import { parseStudioData } from '../../utils/studioExport';
import { findConnectedInstruments } from '../../utils/hapaxExport';
import type { Device, Setup, Track } from './repository';
import { CONNECTORS, hapaxHandlePort } from './hardwareConnectors';
import { bindExistingPorts, connectorForPort, hardwarePanel, panelFace, physicalPorts, physicalPortsCompatible } from './hardwarePanels';
import { nodeHardwareId } from './hardwareVisuals';

export interface CableWorkspace {
  version: 1;
  nodes: Node<InstrumentNodeData>[];
  edges: StudioEdge[];
  customPresets: InstrumentPreset[];
  sourceTracks?: string;
}

export const trackSignature = (tracks: Track[]) => JSON.stringify(tracks);

export function durableWorkspace(state: CableWorkspace): CableWorkspace {
  return { version: 1, sourceTracks: state.sourceTracks,
    nodes: state.nodes.map(n => ({ id: n.id, type: 'instrument', position: n.position, data: n.data })),
    edges: state.edges.map(e => ({ id: e.id, type: 'custom', source: e.source, target: e.target,
      sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, data: { portType: e.data?.portType || 'midi' } })),
    customPresets: state.customPresets };
}

export function readWorkspace(text: string): CableWorkspace {
  const parsed = parseStudioData(text);
  return durableWorkspace({ ...parsed, sourceTracks: JSON.parse(text).sourceTracks });
}

// Read, never overwrite, the previous browser storage. Recovery is explicit.
export function legacyWorkspace(): CableWorkspace | null {
  try {
    const saved = localStorage.getItem('studiograph-studio');
    if (!saved) return null;
    const state = JSON.parse(saved).state;
    if (!state || (!state.customPresets?.length && state.nodes?.length <= 1)) return null;
    return readWorkspace(JSON.stringify({ version: 1, ...state }));
  } catch { return null; }
}

export function definitionData(raw: string): Partial<InstrumentNodeData> {
  const data: Partial<InstrumentNodeData> = { ccMap: [], nrpnMap: [], assignCCs: [], automationLanes: [], drumLanes: [], sourceDefinition: raw };
  let section = '';
  for (const original of raw.split('\n')) {
    const line = original.split('#')[0].trim();
    if (/^TYPE (POLY|DRUM|MPE)$/.test(line)) data.type = line.slice(5) as InstrumentNodeData['type'];
    if (line.startsWith('[')) { section = line.startsWith('[/') ? '' : line.slice(1, -1); continue; }
    const match = line.match(/^(\S+)\s+(.+)$/);
    if (section === 'AUTOMATION' && line) {
      const [type, a, b, depth] = line.split(':');
      const slot = data.automationLanes!.length + 1;
      if (['CC', 'PB', 'AT', 'CV', 'NRPN'].includes(type)) data.automationLanes!.push({ slot, type: type as AutomationLane['type'],
        ...(type === 'CC' ? { ccNumber: Number(a) } : type === 'CV' ? { cvNumber: Number(a) } : type === 'NRPN' ? { nrpnMsb: Number(a), nrpnLsb: Number(b), nrpnDepth: Number(depth) === 14 ? 14 : 7 } : {}) });
    }
    if (!match) continue;
    const [, code, name] = match;
    if (section === 'CC' && /^\d+$/.test(code)) data.ccMap!.push({ ccNumber: Number(code), paramName: name });
    if (section === 'NRPN' && /^\d+:\d+:(7|14)$/.test(code)) {
      const [msb, lsb, depth] = code.split(':').map(Number);
      data.nrpnMap!.push({ msb, lsb, depth: depth as 7 | 14, paramName: name });
    }
    if (section === 'ASSIGN' && /^\d+$/.test(code)) {
      const parts = name.match(/^(.*)\s+(\d+)$/);
      data.assignCCs!.push({ slot: data.assignCCs!.length + 1, ccNumber: Number(code), paramName: parts?.[1] || name, defaultValue: Number(parts?.[2] || 0) });
    }
    if (section === 'DRUMLANES' && /^\d+:(NULL|\d+):[^:]+:(NULL|\d+)$/.test(code)) {
      const [lane, trig, chan, note] = code.split(':');
      data.drumLanes!.push({ lane: Number(lane), trig: trig === 'NULL' ? null : Number(trig), chan: chan === 'NULL' ? null : chan, note: note === 'NULL' ? null : Number(note), name });
    }
  }
  return data;
}

const routeHandles = (port: string): string[] => /^[A-D]$/.test(port) ? [`midi-${port.toLowerCase()}`]
  : port === 'USBH' ? ['usb-host'] : port === 'USBD' ? ['usb-device']
    : port.startsWith('CVG') ? [`gate-${port.slice(-1)}`, `cv-${port.slice(-1)}`]
      : port.startsWith('CV') ? [`cv-${port.slice(-1)}`] : port.startsWith('G') ? [`gate-${port.slice(-1)}`] : [];

export function equipmentPreset(device: Device): InstrumentPreset {
  return { id: `repo:${device.id}`, hardwareId: device.id, name: device.title, manufacturer: device.kind, type: 'POLY', isRemovable: true,
    ...physicalPorts(device.id), iconId: 'music' };
}

export function seedWorkspace(setup: Setup, devices: Device[], definitions: Record<string, string>): CableWorkspace {
  const hapax: Node<InstrumentNodeData> = { id: 'hapax', type: 'instrument', position: { x: 0, y: 0 }, data: {
    ...HAPAX_PRESET, channel: 1, ccMap: [], nrpnMap: [], assignCCs: [], automationLanes: [], showCVPorts: true } };
  const nodes = [hapax]; const edges: StudioEdge[] = [];
  setup.tracks.forEach((t, i) => {
    const id = `track-${t.number}-${t.device}`;
    const handles = routeHandles(t.port);
    const legacyInputs: Port[] = handles.length ? handles.map((h, n) => ({ id: `in-${n}`, label: h.startsWith('usb') ? h === 'usb-host' ? 'USB Device' : 'USB Host' : h.startsWith('midi') ? 'MIDI In' : h.startsWith('cv') ? 'CV In' : 'Gate In',
      type: h.startsWith('usb') ? 'usb' : h.startsWith('midi') ? 'midi' : 'cv' })) : [{ id: 'in-0', label: 'MIDI In', type: 'midi' }];
    const real = hardwarePanel(t.device) ? physicalPorts(t.device) : undefined;
    const inputs = real?.inputs || legacyInputs;
    const targets = handles.map((h, n) => {
      if (!real) return legacyInputs[n];
      const source = HAPAX_PRESET.outputs.find(p => p.id === h);
      if (!source) return undefined;
      const candidates = inputs.filter(p => physicalPortsCompatible('hapax', source, t.device, p));
      if (h.startsWith('cv')) return candidates.find(p => p.connectorId === 'pitch');
      if (h.startsWith('gate')) return candidates.find(p => ['contour-gate', 'trigger'].includes(p.connectorId || ''));
      return candidates.length === 1 ? candidates[0] : undefined;
    });
    const unresolved = handles.filter((_, n) => !targets[n]);
    nodes.push({ id, type: 'instrument', position: { x: (i % 3) * 350, y: 340 + Math.floor(i / 3) * 250 }, data: {
      name: t.name, hardwareId: t.device, manufacturer: devices.find(d => d.id === t.device)?.title || t.device, channel: t.channel || 1,
      type: 'POLY', inputs, outputs: real?.outputs || [], ccMap: [], nrpnMap: [], assignCCs: [], automationLanes: [],
      ...(unresolved.length ? { hardwareRouteWarning: `Ruta ${t.port} sin entrada física inequívoca. Selecciona el conector en el cableado.` } : {}),
      ...definitionData(definitions[t.definition] || ''), isRemovable: true, showCVPorts: true, trackNumber: t.number } });
    handles.forEach((h, n) => { const target = targets[n]; if (target) edges.push({ id: `${id}:${h}`, source: 'hapax', sourceHandle: h, target: id, targetHandle: target.id,
      type: 'custom', data: { portType: target.type } }); });
  });
  return autoArrangeWorkspace({ version: 1, nodes, edges, customPresets: [], sourceTracks: trackSignature(setup.tracks) });
}

/** Three readable columns below the physical panel, with room for each node. */
export function autoArrangeWorkspace(workspace: CableWorkspace): CableWorkspace {
  const instrumentPort = (id: string) => {
    const xs = workspace.edges.filter(e => e.target === id && workspace.nodes.find(n => n.id === e.source)?.data.isHapax)
      .map(e => CONNECTORS.find(c => c.port === hapaxHandlePort(e.sourceHandle || ''))?.x).filter((x): x is number => x !== undefined);
    return xs.length ? xs.reduce((sum, x) => sum + x, 0) / xs.length : 1000;
  };
  const instruments = workspace.nodes.filter(n => !n.data.isHapax).sort((a, b) => instrumentPort(a.id) - instrumentPort(b.id));
  const columns = Math.min(3, Math.max(1, instruments.length));
  const sizes = instruments.map(n => {
    const panel = hardwarePanel(nodeHardwareId(n.id, n.data));
    if (!panel) return { width: n.data.width || Math.max(260, Math.max(n.data.inputs.length, n.data.outputs.length) * 88 + 40), height: 250 };
    const width = Math.max(620, n.data.width || 800);
    const side = panelFace(panel, n.data.hardwareView);
    const face = panel.faces[side]!;
    const columns = Math.max(1, Math.floor((width - 24) / 113));
    const ports = bindExistingPorts(nodeHardwareId(n.id, n.data), n.data);
    const rails = (['input', 'output'] as const).map(direction => {
      const count = ports[direction === 'input' ? 'inputs' : 'outputs'].filter(p => connectorForPort(panel, p, direction)?.face !== side).length;
      return count ? Math.ceil(count / columns) * 58 + 28 : 0;
    });
    return { width, height: width * face.height / face.width + 60 + (face.note || n.data.hardwareRouteWarning ? 80 : 0) + rails[0] + rails[1] };
  });
  const cellWidth = Math.max(330, ...sizes.map(s => s.width)) + 40;
  const rowHeight = Math.max(300, ...sizes.map(s => s.height + 40));
  const panelWidth = Math.max(1000, ...workspace.nodes.filter(n => n.data.isHapax).map(n => n.data.width || 1000));
  const span = Math.max(panelWidth, cellWidth * columns - 40);
  const positions = new Map(instruments.map((n, i) => {
    const row = Math.floor(i / columns); const count = Math.min(columns, instruments.length - row * columns);
    const left = (span - (count * cellWidth - 40)) / 2;
    return [n.id, { x: left + (i % columns) * cellWidth, y: panelWidth * .235 + 105 + row * rowHeight }];
  }));
  return { ...workspace, nodes: workspace.nodes.map(n => ({ ...n, position: n.data.isHapax ? { x: (span - Math.max(900, n.data.width || 1000)) / 2, y: 0 } : positions.get(n.id)! })) };
}

export function applyWorkspaceRoutes(workspace: CableWorkspace, tracks: Track[]): Track[] {
  const connected = findConnectedInstruments(workspace.nodes, workspace.edges);
  return tracks.map(t => {
    const nodes = workspace.nodes.filter(n => n.data.trackNumber === t.number);
    if (nodes.length > 1) throw new Error(`Hay varios bloques vinculados a la pista ${t.number}. Conserva uno antes de aplicar.`);
    const node = nodes[0];
    if (!node) return t;
    const routes = connected.filter(c => c.node.id === node.id);
    if (routes.length > 1) throw new Error(`La pista ${t.number} recibe varias salidas. Elige una antes de aplicar.`);
    const route = routes[0];
    return { ...t, port: route?.hapaxPort || 'NULL', channel: route?.isAnalog ? 0 : node.data.channel };
  });
}
