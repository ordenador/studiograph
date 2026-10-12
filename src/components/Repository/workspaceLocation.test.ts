import { describe, expect, it } from 'vitest';
import { locationQuery, openLocation, readLocation, sameRecord, selectionFor } from './workspaceLocation';

describe('shareable workspace locations', () => {
  it('opens the requested setup and Hapax panel from a copied URL', () => {
    const location = readLocation('?setup=felucca-duo&tab=hapax&panel=top&track=2&port=B');
    expect(selectionFor(location)).toEqual({ category: 'setups', id: 'felucca-duo' });
    expect(location).toMatchObject({ view: 'hardware', panel: 'top', track: 2, port: 'B' });
    expect(readLocation(locationQuery(location))).toEqual(location);
  });
  it('distinguishes the home preview from the setup editor and defaults to home', () => {
    expect(selectionFor(readLocation(''))).toBeNull();
    expect(selectionFor(readLocation('?setup=studio&tab=home'))).toBeNull();
    expect(selectionFor(readLocation('?setup=studio'))).toEqual({ category: 'setups', id: 'studio' });
  });
  it('links directly to a track and keeps setup context when opening a device', () => {
    const home = readLocation('?setup=felucca-duo&tab=home');
    const track = openLocation({ category: 'setups', id: 'felucca-duo' }, home, 4);
    expect(locationQuery(track)).toBe('?setup=felucca-duo&tab=tracks&track=4');
    const device = openLocation({ category: 'devices', id: 'fm1-b' }, track);
    expect(selectionFor(readLocation(locationQuery(device)))).toEqual({ category: 'devices', id: 'fm1-b' });
    expect(openLocation(null, device).setup).toBe('felucca-duo');
  });
  it('does not accept invalid track numbers, arbitrary ports or unknown tabs', () => {
    for (const value of ['0', '-1', '17', '1.5', 'NaN', '']) expect(readLocation(`?track=${value}`).track).toBe(0);
    const location = readLocation('?setup=studio&tab=unknown&panel=bad&port=javascript%3Aalert');
    expect(location).toMatchObject({ view: 'home', panel: 'rear', port: '' });
    expect(readLocation('?tab=hardware').view).toBe('hardware');
  });
  it('protects a draft when leaving its record while allowing view navigation', () => {
    const tracks = readLocation('?setup=felucca-duo&tab=tracks&track=2');
    expect(sameRecord(tracks, readLocation('?setup=felucca-duo&tab=hapax&port=A'))).toBe(true);
    expect(sameRecord(tracks, readLocation('?setup=felucca-duo&tab=home'))).toBe(false);
    expect(sameRecord(tracks, readLocation('?setup=studio&tab=tracks'))).toBe(false);
    expect(sameRecord(tracks, readLocation('?device=fm1-a'))).toBe(false);
  });
});
