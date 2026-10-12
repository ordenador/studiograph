import { describe, expect, it } from 'vitest';
import { groupRoutes, signalKind } from './routingModel';
import type { Track } from './repository';

const part = (number: number, device: string, port: string, channel: number): Track => ({
  number, device, port, channel, name: `Parte ${number}`, definition: 'felucca-nrpn-poly.txt',
});

describe('readable routing map', () => {
  it('keeps different ports and unassigned parts on the same physical FM-1', () => {
    const tracks = [part(4, 'fm1-a', 'USBH', 4), part(1, 'fm1-a', 'A', 1), part(2, 'fm1-a', 'NULL', 2)];
    const groups = groupRoutes(tracks, []);
    expect(groups).toHaveLength(1);
    expect(groups[0].tracks.map(t => t.number)).toEqual([1, 2, 4]);
    expect(groups[0].routes.map(r => r.port)).toEqual(['A', 'NULL', 'USBH']);
    expect(tracks.map(t => t.number)).toEqual([4, 1, 2]);
  });
  it('shows the two units with their actual parts without inventing resolved outputs', () => {
    const groups = groupRoutes([part(1, 'fm1-a', 'NULL', 1), part(2, 'fm1-a', 'NULL', 4), part(3, 'fm1-b', 'NULL', 5)], []);
    expect(groups.map(g => g.id)).toEqual(['fm1-a', 'fm1-b']);
    expect(groups.map(g => g.tracks.length)).toEqual([2, 1]);
    expect(groups.flatMap(g => g.routes).every(r => r.signal === 'pending')).toBe(true);
  });
  it('preserves individual CV, Gate and paired outputs and labels unknown signals honestly', () => {
    const groups = groupRoutes([part(1, 'synth', 'CV2', 0), part(2, 'synth', 'G3', 0), part(3, 'synth', 'CVG4', 0)], []);
    expect(groups[0].routes.map(r => r.port)).toEqual(['CV2', 'G3', 'CVG4']);
    expect(groups[0].routes.every(r => r.signal === 'cv')).toBe(true);
    expect(signalKind('USBH')).toBe('usb');
    expect(signalKind('D')).toBe('midi');
    expect(signalKind('UNKNOWN')).toBe('other');
  });
});
