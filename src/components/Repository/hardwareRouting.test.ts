import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { panelRoutes } from './hardwareRouting';
import { HapaxHardware } from './HapaxHardware';
import type { Track } from './repository';

const part = (number: number, device: string, port: string, channel: number): Track => ({ number, device, port, channel,
  name: `Part ${number}`, definition: 'felucca-nrpn-poly.txt' });

describe('Hapax panel routing from configured tracks', () => {
  it('does not draw cables for an unconfigured pair of FM-1 units', () => {
    const routes = panelRoutes([part(1, 'fm1-a', 'NULL', 1), part(2, 'fm1-b', 'NULL', 5)], []);
    expect(routes).toEqual([]);
    const svg = renderToStaticMarkup(createElement(HapaxHardware, { routes }));
    expect(svg).not.toContain('data-route=');
  });
  it('uses one MIDI connector per unit and includes every part/channel', () => {
    const routes = panelRoutes([part(1, 'fm1-a', 'A', 1), part(2, 'fm1-a', 'A', 4), part(3, 'fm1-b', 'B', 5)], []);
    expect(routes).toHaveLength(2);
    expect(routes.find(r => r.port === 'A')).toMatchObject({ sources: [811], label: 'MIDI A · CH 1, 4' });
    expect(routes.find(r => r.port === 'A')?.tracks).toHaveLength(2);
    const svg = renderToStaticMarkup(createElement(HapaxHardware, { routes }));
    expect(svg).toContain('data-route="A"');
    expect(svg).toContain('data-route="B"');
  });
  it('draws both physical jacks only for paired CV/Gate, preserving individual outputs', () => {
    const routes = panelRoutes([part(1, 'paired', 'CVG1', 0), part(2, 'single-cv', 'CV2', 0), part(3, 'single-gate', 'G3', 0)], []);
    expect(routes.find(r => r.port === 'CVG1')?.sources).toEqual([433, 557]);
    expect(routes.find(r => r.port === 'CV2')?.sources).toEqual([528]);
    expect(routes.find(r => r.port === 'G3')?.sources).toEqual([375]);
    const svg = renderToStaticMarkup(createElement(HapaxHardware, { routes }));
    expect([...svg.matchAll(/data-route="CVG1"/g)]).toHaveLength(2);
  });
});
