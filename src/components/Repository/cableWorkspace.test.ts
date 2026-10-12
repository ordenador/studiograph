import { describe, expect, it } from 'vitest';
import { applyWorkspaceRoutes, autoArrangeWorkspace, definitionData, durableWorkspace, legacyWorkspace, readWorkspace, seedWorkspace } from './cableWorkspace';
import { generateAllDefinitions } from '../../utils/hapaxExport';
import type { Setup } from './repository';
import { useStudioStore } from '../../store/useStudioStore';

const raw = `VERSION 1\nTRACKNAME Bass\nTYPE POLY\nOUTPORT NULL\nOUTCHAN 1\nINPORT USBD\nMAXRATE 30\n[CC]\n7 Volume\n[/CC]\n[NRPN]\n0:64:14 Frequency\n[/NRPN]\n[PC]\n12 Scene12\n[/PC]\n[ASSIGN]\n7 Volume 90\n[/ASSIGN]\n[AUTOMATION]\nCC:7\nPB:\nAT:\nCV:2\nNRPN:0:64:14\n[/AUTOMATION]\n[DRUMLANES]\n8:NULL:NULL:36 Kick\n[/DRUMLANES]\n[COMMENT]\nKeep author's instructions\n[/COMMENT]\n[FUTURE]\nopaque\n[/FUTURE]`;
const setup: Setup = { id: 'duo', title: 'Duo', status: 'draft', clock_source: 'internal', physical_verified: false,
  tracks: [{ number: 1, name: 'Bass', device: 'a', port: 'A', channel: 4, definition: 'bass.txt' },
    { number: 2, name: 'Pad', device: 'b', port: 'NULL', channel: 5, definition: 'bass.txt' }] };
const graph = () => seedWorkspace(setup, [], { 'bass.txt': raw });

describe('setup cable workspace', () => {
  it('ends a drag even when React Flow emits no final position, allowing persistence', () => {
    const workspace = graph(); const store = useStudioStore.getState();
    store.importStudio(workspace.nodes, workspace.edges, []);
    store.onNodesChange([{ type: 'position', id: workspace.nodes[1].id, position: { x: 100, y: 400 }, dragging: true }]);
    expect(useStudioStore.getState().nodes[1].dragging).toBe(true);
    store.onNodesChange([{ type: 'position', id: workspace.nodes[1].id, dragging: false }]);
    const node = useStudioStore.getState().nodes[1];
    expect(node.dragging).toBe(false);expect(node.position).toEqual({ x: 100, y: 400 });
    expect(durableWorkspace({ ...useStudioStore.getState(), version: 1 }).nodes[1].dragging).toBeUndefined();
  });
  it('arranges nodes below Hapax across columns without modifying cables or maps', () => {
    const workspace = graph();
    const arranged = autoArrangeWorkspace(workspace);
    expect(arranged.nodes[1].position.x).not.toBe(arranged.nodes[2].position.x);
    expect(arranged.nodes[1].position.y).toBeGreaterThan(235);
    expect(arranged.edges).toEqual(workspace.edges);
    expect(arranged.nodes[1].data).toEqual(workspace.nodes[1].data);
    expect(autoArrangeWorkspace(arranged)).toEqual(arranged);
  });
  it('offers old local data for recovery without deleting or mutating that storage', () => {
    const previous = JSON.stringify({ state: graph(), version: 0 });
    localStorage.setItem('studiograph-studio', previous);
    expect(legacyWorkspace()?.nodes).toHaveLength(3);
    expect(localStorage.getItem('studiograph-studio')).toBe(previous);
    localStorage.removeItem('studiograph-studio');
  });
  it('loads full instrument maps, assign, automation types and drum lanes from sources', () => {
    const data = definitionData(raw);
    expect(data.nrpnMap?.[0].depth).toBe(14);
    expect(data.assignCCs?.[0].defaultValue).toBe(90);
    expect(data.automationLanes?.map(a => a.type)).toEqual(['CC', 'PB', 'AT', 'CV', 'NRPN']);
    expect(data.drumLanes?.[0]).toEqual({ lane: 8, trig: null, chan: null, note: 36, name: 'Kick' });
  });
  it('keeps pending FM-1 routes disconnected and canonical tracks untouched', () => {
    const workspace = graph();
    expect(workspace.edges).toHaveLength(1);
    expect(workspace.nodes[2].data.trackNumber).toBe(2);
    expect(setup.tracks[1].port).toBe('NULL');
    expect(applyWorkspaceRoutes(workspace, setup.tracks)).toEqual(setup.tracks);
  });
  it('round trips graph data while ignoring selection and measurements', () => {
    const workspace = graph();
    workspace.nodes[1].selected = true; workspace.nodes[1].measured = { width: 300, height: 150 };
    workspace.nodes[1].data.automationLanes!.push({ slot: 6, type: 'CC', ccNumber: 12 });
    const durable = durableWorkspace(workspace);
    expect(durable.nodes[1].selected).toBeUndefined();
    expect(durable.nodes[1].measured).toBeUndefined();
    expect(readWorkspace(JSON.stringify(durable))).toEqual(durable);
  });
  it('applies routing through MIDI thru and preserves track names and definitions', () => {
    const workspace = graph();
    workspace.nodes[1].data.outputs.push({ id: 'thru', label: 'MIDI Thru', type: 'midi' });
    workspace.edges.push({ id: 'thru', source: workspace.nodes[1].id, target: workspace.nodes[2].id,
      sourceHandle: 'thru', targetHandle: 'in-0', data: { portType: 'midi' } });
    const tracks = applyWorkspaceRoutes(workspace, setup.tracks);
    expect(tracks[1]).toEqual({ ...setup.tracks[1], port: 'A' });
  });
  it('refuses ambiguous routing rather than arbitrarily choosing a Hapax output', () => {
    const workspace = graph();
    workspace.nodes[1].data.inputs.push({ id: 'in-2', label: 'MIDI 2', type: 'midi' });
    workspace.edges.push({ id: 'second', source: 'hapax', target: workspace.nodes[1].id,
      sourceHandle: 'midi-b', targetHandle: 'in-2', data: { portType: 'midi' } });
    expect(() => applyWorkspaceRoutes(workspace, setup.tracks)).toThrow('varias salidas');
  });
  it('exports edits without dropping PC, INPORT, MAXRATE, comments or future sections', () => {
    const workspace = graph();
    workspace.nodes[1].data.assignCCs = [{ slot: 1, ccNumber: 7, paramName: 'Volume', defaultValue: 99 }];
    const content = generateAllDefinitions(workspace.nodes, workspace.edges)[0].content;
    for (const text of ['0:64:14 Frequency', '7 Volume 99', '[PC]\n12 Scene12\n[/PC]', 'INPORT USBD', 'MAXRATE 30', "Keep author's instructions", '[FUTURE]\nopaque\n[/FUTURE]']) expect(content).toContain(text);
  });
  it('applies paired CV/gate as one track destination with no MIDI channel', () => {
    const analog = { ...setup, tracks: [{ ...setup.tracks[0], port: 'CVG1', channel: 0 }] };
    const workspace = seedWorkspace(analog, [], { 'bass.txt': raw });
    expect(workspace.edges).toHaveLength(2);
    expect(applyWorkspaceRoutes(workspace, analog.tracks)[0]).toEqual(analog.tracks[0]);
  });
});
