import { describe, expect, it } from 'vitest';
import { buildDiagram } from './diagramModel';
import { changes, isDirty, routeWarnings, type Setup, type Track } from './repository';

const track = (number: number, device: string, port: string, channel: number): Track => ({ number, device, port, channel, name: `Part ${number}`, definition: 'felucca-nrpn-poly.txt' });
const setup: Setup = { id: 'duo', title: 'Two units', status: 'draft', physical_verified: false, clock_source: 'internal',
  tracks: [track(1, 'fm1-a', 'A', 1), track(2, 'fm1-a', 'A', 4), track(3, 'fm1-b', 'B', 5)] };

describe('repository music model', () => {
  it('groups parts on physical units and labels shared routes with their channels', () => {
    const graph = buildDiagram(setup, []);
    expect(graph.nodes.map(n => n.id)).toEqual(['hapax', 'device:fm1-a', 'device:fm1-b']);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges.find(e => e.sourceHandle === 'A')?.label).toBe('CH 1, CH 4');
  });
  it('never invents cables for unresolved outputs', () => {
    const graph = buildDiagram({ ...setup, tracks: setup.tracks.map(t => ({ ...t, port: 'NULL' })) }, []);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toEqual([]);
  });
  it('preserves the exact CV or Gate output rather than replacing it with a pair', () => {
    const graph = buildDiagram({ ...setup, tracks: [track(1, 'spectravox', 'CV2', 0), track(2, 'spectravox', 'G3', 0)] }, []);
    expect(graph.edges.map(e => e.sourceHandle)).toEqual(['CV2', 'G3']);
  });
  it('does not label different MIDI channels on one unit as conflicts', () => {
    expect(routeWarnings(setup.tracks)).toEqual([]);
    expect(routeWarnings([...setup.tracks, track(4, 'another-unit', 'A', 1)])).toHaveLength(1);
  });
  it('sends only editable fields without changing physical verification', () => {
    const payload = changes('setups', setup);
    expect(payload).not.toHaveProperty('physical_verified');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('id');
    expect(isDirty('setups', setup, { ...setup, studio_layout: {} })).toBe(false);
    expect(isDirty('setups', setup, { ...setup, tracks: setup.tracks.map(t => ({ ...t, channel: t.channel + 1 })) })).toBe(true);
  });
});
