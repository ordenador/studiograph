import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { bindExistingPorts, conflictingUsbEdges, connectorForPort, enrichPhysicalPorts, hardwarePanel, isSignalConnector, physicalPorts, physicalPortsCompatible } from './hardwarePanels';
import { HAPAX_PRESET } from '../../data/defaultNodes';
import { HARDWARE_VISUALS } from './hardwareVisuals';
import { DeviceHardware } from './DeviceHardware';
import { applyWorkspaceRoutes, durableWorkspace, equipmentPreset, readWorkspace, seedWorkspace } from './cableWorkspace';
import type { Device, Setup } from './repository';
import type { Port } from '../../types';
import { useStudioStore } from '../../store/useStudioStore';

const assets = import.meta.glob('../../../public/hardware/*.svg', { query: '?raw', import: 'default', eager: true });

describe('physical hardware catalogue', () => {
  it('covers every model and rear face with local SVGs whose socket coordinates match the data', () => {
    for (const id of Object.keys(HARDWARE_VISUALS)) {
      const panel = hardwarePanel(id)!;
      expect(panel, id).toBeDefined();
      expect(panel.faces.rear, id).toBeDefined();
      expect(panel.faces[panel.defaultFace]).toBeDefined();
      expect(panel.sources.length).toBeGreaterThan(0);
      expect(new Set(panel.connectors.map(c => c.id)).size).toBe(panel.connectors.length);
      for (const [side, face] of Object.entries(panel.faces)) {
        const svg = String(Object.entries(assets).find(([path]) => path.endsWith(`/${face.asset}.svg`))?.[1]);
        expect(svg, `${id}/${side}`).toContain(`viewBox="0 0 ${face.width} ${face.height}"`);
        expect(svg).not.toMatch(/<script|<image|<foreignObject|href=/);
        for (const c of panel.connectors.filter(c => c.face === side)) {
          expect(c.x).toBeGreaterThan(0); expect(c.x).toBeLessThan(face.width);
          expect(c.y).toBeGreaterThan(0); expect(c.y).toBeLessThan(face.height);
          expect(svg).toContain(`data-connector-id="${c.id}"`);
        }
      }
      const markup = renderToStaticMarkup(createElement(DeviceHardware, { id, view: 'rear' }));
      expect(markup).toContain('data-hardware-face="rear"');
    }
  });
  it('distinguishes real sockets, variants and non-signal connections', () => {
    expect(hardwarePanel('constructor')).toBeUndefined();
    expect(hardwarePanel('fm1-a')).toBe(hardwarePanel('fm1-b'));
    expect(hardwarePanel('fm1-nrpn-test')).toBe(hardwarePanel('fm1-a'));
    expect(hardwarePanel('fm1-a')!.connectors.filter(c => c.signal === 'midi').map(c => c.id)).toEqual(['midi-in']);
    expect(hardwarePanel('op1-field')!.connectors.every(c => c.face === 'right')).toBe(true);
    expect(hardwarePanel('spectravox')!.connectors.some(c => c.signal === 'midi')).toBe(false);
    expect(hardwarePanel('spectravox')!.connectors.filter(c => c.kind === 'jack-35')).toHaveLength(36);
    expect(hardwarePanel('ep-136')!.connectors.filter(c => c.signal === 'midi')).toHaveLength(0);
    expect(hardwarePanel('quad-cortex')!.connectors.find(c => c.id === 'usb')?.kind).toBe('usb-b');
    expect(hardwarePanel('quad-cortex')!.connectors.find(c => c.id === 'capture')?.direction).toBe('output');
    for (const id of ['keystep-32', 'keystep-37']) {
      expect(hardwarePanel(id)!.connectors.filter(c => c.signal === 'cv' && c.direction === 'output')).toHaveLength(5);
      expect(hardwarePanel(id)!.connectors.find(c => c.id === 'usb')?.kind).toBe('usb-c');
      expect(hardwarePanel(id)!.connectors.some(c => c.kind === 'dc')).toBe(false);
    }
    const l6 = hardwarePanel('livetrak')!;
    expect(l6.connectors.filter(c => c.signal === 'audio' && c.direction === 'input')).toHaveLength(12);
    expect(l6.connectors.find(c => c.id === 'power')?.kind).toBe('usb-c');
    expect(l6.connectors.find(c => c.id === 'power')?.signal).toBe('power');
    expect(l6.connectors.find(c => c.id === 'usb')?.face).toBe('top');
    for (const id of Object.keys(HARDWARE_VISUALS)) {
      const ports = physicalPorts(id);
      for (const port of [...ports.inputs, ...ports.outputs]) {
        const c = hardwarePanel(id)!.connectors.find(c => c.id === port.connectorId)!;
        expect(isSignalConnector(c)).toBe(true);
      }
    }
  });
  it('uses one USB receptacle with two directional handles, excluding DC and expression pedals', () => {
    const ports = physicalPorts('quad-cortex');
    expect(ports.inputs.find(p => p.connectorId === 'usb')?.id).not.toBe(ports.outputs.find(p => p.connectorId === 'usb')?.id);
    expect([...ports.inputs, ...ports.outputs].some(p => ['power','exp-1','exp-2'].includes(p.connectorId!))).toBe(false);
  });
  it('requires a USB host for known sockets without breaking generic saved USB ports', () => {
    const fm = physicalPorts('fm1-a').inputs.find(p => p.type === 'usb')!;
    const qc = physicalPorts('quad-cortex').outputs.find(p => p.type === 'usb')!;
    const op = physicalPorts('op1-field').outputs.find(p => p.type === 'usb')!;
    expect(physicalPortsCompatible('quad-cortex', qc, 'fm1-a', fm)).toBe(false);
    expect(physicalPortsCompatible('op1-field', op, 'fm1-a', fm)).toBe(true);
    expect(physicalPortsCompatible('hapax', HAPAX_PRESET.outputs.find(p => p.id === 'usb-host')!, 'fm1-a', fm)).toBe(true);
    expect(physicalPortsCompatible('hapax', HAPAX_PRESET.outputs.find(p => p.id === 'usb-device')!, 'fm1-a', fm)).toBe(false);
    expect(physicalPortsCompatible('unknown', { id: 'usb', type: 'usb', label: 'USB' }, 'fm1-a', fm)).toBe(true);
  });
  it('replaces the previous USB cable when the opposite handle of the same socket is used', () => {
    const setup: Setup = { id: 'test', title: 'Test', status: 'draft', clock_source: 'internal', physical_verified: false,
      tracks: [{ number: 1, device: 'op1-field', port: 'USBH', channel: 1, name: 'OP1', definition: '' },
        { number: 2, device: 'fm1-a', port: 'NULL', channel: 1, name: 'FM', definition: '' }] };
    const graph = seedWorkspace(setup, [], {});
    const connection = { source: graph.nodes[1].id, sourceHandle: 'physical:usb:out', target: graph.nodes[2].id, targetHandle: 'physical:usb:in' };
    graph.edges.push({ id: 'audio-kept', source: graph.nodes[1].id, sourceHandle: 'physical:audio-out:out', target: graph.nodes[2].id, targetHandle: 'legacy-audio', data: { portType: 'audio' } });
    expect(conflictingUsbEdges(graph.nodes, graph.edges, connection)).toEqual(['track-1-op1-field:usb-host']);
  });
  it('preserves legacy IDs, keeps ambiguous sockets unbound and adds missing real ports idempotently', () => {
    const original = { inputs: [{ id: 'in-0', label: 'MIDI In', type: 'midi' } as Port], outputs: [] as Port[] };
    const before = JSON.stringify(original);
    const bound = bindExistingPorts('fm1-a', original);
    expect(bound.inputs[0]).toEqual({ ...original.inputs[0], connectorId: 'midi-in' });
    expect(bound.inputs).toHaveLength(1);
    expect(bound.outputs).toHaveLength(0);
    const augmented = enrichPhysicalPorts('fm1-a', original);
    expect(augmented.inputs[0].id).toBe('in-0');
    expect(augmented.outputs.some(p => p.connectorId === 'audio-out')).toBe(true);
    expect(enrichPhysicalPorts('fm1-a', augmented)).toEqual(augmented);
    const audio = { inputs: [{ id: 'in-0', label: 'Audio', type: 'audio' } as Port], outputs: [] };
    expect(bindExistingPorts('livetrak', audio).inputs[0].connectorId).toBeUndefined();
    expect(enrichPhysicalPorts('livetrak', audio).inputs[0].id).toBe('in-0');
    expect(JSON.stringify(original)).toBe(before);
  });
  it('enriches a saved node without deleting or renaming its existing cable', () => {
    const setup: Setup = { id: 'old', title: 'Old', status: 'draft', clock_source: 'internal', physical_verified: false,
      tracks: [{ number: 1, device: 'fm1-a', port: 'A', channel: 1, name: 'FM', definition: '' }] };
    const graph = seedWorkspace(setup, [], {});
    graph.nodes[1].data.inputs = [{ id: 'in-0', label: 'MIDI In', type: 'midi' }];
    graph.nodes[1].data.outputs = [];
    graph.edges[0].targetHandle = 'in-0';
    const before = JSON.stringify(graph.edges);
    const store = useStudioStore.getState();
    store.importStudio(graph.nodes, graph.edges, []);
    store.updateNodeData(graph.nodes[1].id, enrichPhysicalPorts('fm1-a', graph.nodes[1].data));
    expect(JSON.stringify(useStudioStore.getState().edges)).toBe(before);
    expect(useStudioStore.getState().nodes[1].data.inputs.find(p => p.id === 'in-0')?.connectorId).toBe('midi-in');
    expect(applyWorkspaceRoutes({ version: 1, ...useStudioStore.getState() }, setup.tracks)).toEqual(setup.tracks);
  });
  it('creates real preset ports and persists a cable when faces change and the graph round trips', () => {
    const preset = equipmentPreset({ id: 'op1-field', title: 'OP-1', kind: 'synth' } as Device);
    const store = useStudioStore.getState();
    store.importStudio([], [], []);
    store.addNode(preset, { x: 0, y: 0 });
    store.addNode(equipmentPreset({ id: 'livetrak', title: 'L6', kind: 'mixer' } as Device), { x: 850, y: 0 });
    let [source, target] = useStudioStore.getState().nodes;
    const sourceHandle = source.data.outputs.find(p => p.connectorId === 'audio-out')!.id;
    const targetHandle = target.data.inputs.find(p => p.connectorId === 'input-1')!.id;
    store.addEdge({ source: source.id, target: target.id, sourceHandle, targetHandle }, 'audio');
    store.updateNodeData(source.id, { hardwareView: 'rear' });
    store.updateNodeData(target.id, { hardwareView: 'right' });
    const saved = durableWorkspace({ version: 1, ...useStudioStore.getState() });
    const loaded = readWorkspace(JSON.stringify(saved));
    expect(loaded.edges).toEqual(saved.edges);
    expect(loaded.nodes.map(n => n.data)).toEqual(saved.nodes.map(n => ({ ...JSON.parse(JSON.stringify(n.data)), showCVPorts: false })));
    [source, target] = loaded.nodes;
    expect(source.data.hardwareView).toBe('rear');
    expect(target.data.hardwareView).toBe('right');
    expect(loaded.edges).toHaveLength(1);
    expect(loaded.edges[0].sourceHandle).toBe(sourceHandle);
    expect(connectorForPort(hardwarePanel('op1-field')!, source.data.outputs.find(p => p.id === sourceHandle)!, 'output')?.face).toBe('right');
  });
  it('seeds CV/gate to the correct inputs and refuses to invent a MIDI input for Spectravox', () => {
    const setup: Setup = { id: 'test', title: 'Test', status: 'draft', clock_source: 'internal', physical_verified: false,
      tracks: [{ number: 1, device: '0-coast', port: 'CVG1', channel: 0, name: 'Coast', definition: '' },
        { number: 2, device: 'spectravox', port: 'A', channel: 1, name: 'Spec', definition: '' }] };
    const graph = seedWorkspace(setup, [], {});
    expect(graph.edges).toHaveLength(2);
    expect(graph.nodes[1].data.inputs.find(p => p.id === graph.edges[0].targetHandle)?.connectorId).toBe('contour-gate');
    expect(graph.nodes[1].data.inputs.find(p => p.id === graph.edges[1].targetHandle)?.connectorId).toBe('pitch');
    expect(applyWorkspaceRoutes(graph, setup.tracks)[0]).toEqual(setup.tracks[0]);
    expect(graph.nodes[2].data.hardwareRouteWarning).toContain('sin entrada física');
    expect(graph.nodes[2].data.inputs.some(p => p.type === 'midi')).toBe(false);
    expect(setup.tracks[1].port).toBe('A');
  });
});
