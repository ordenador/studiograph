import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeviceHardware } from './DeviceHardware';
import { HARDWARE_ASPECT_RATIOS, HARDWARE_VISUALS, hardwareVisual, nodeHardwareId } from './hardwareVisuals';

const assets = import.meta.glob('../../../public/hardware/*.svg', { query: '?raw', import: 'default', eager: true });

describe('hardware visual catalogue', () => {
  it('renders every registered device using a local vector, without remote image requests', () => {
    for (const [id, visual] of Object.entries(HARDWARE_VISUALS)) {
      const html = renderToStaticMarkup(createElement(DeviceHardware, { id }));
      expect(html).toContain(`data-hardware-id="${id}"`);
      if (id === 'hapax') expect(html).toContain('<svg');
      else {
        expect(html).toContain(`/hardware/${visual.asset}.svg`);
        const entry = Object.entries(assets).find(([path]) => path.endsWith(`/${visual.asset}.svg`));
        expect(entry, `Missing SVG for ${id}`).toBeDefined();
        expect(entry?.[1]).toContain('<title');
        expect(entry?.[1]).not.toMatch(/<script|<image|<foreignObject|href=/);
        const dimensions = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(String(entry?.[1]));
        expect(dimensions, `Missing dimensions for ${id}`).not.toBeNull();
        const [width, height] = HARDWARE_ASPECT_RATIOS[visual.asset!].split('/').map(Number);
        expect(width / height).toBeCloseTo(Number(dimensions![1]) / Number(dimensions![2]));
      }
    }
  });
  it('shares the physical FM-1 model without losing unit identity', () => {
    expect(HARDWARE_VISUALS['fm1-a'].asset).toBe(HARDWARE_VISUALS['fm1-b'].asset);
    expect(HARDWARE_VISUALS['fm1-nrpn-test'].asset).toBe(HARDWARE_VISUALS['fm1-a'].asset);
    expect(HARDWARE_VISUALS['ep-136'].asset).not.toBe(HARDWARE_VISUALS['ep-133'].asset);
    expect(HARDWARE_VISUALS['keystep-37'].asset).not.toBe(HARDWARE_VISUALS['keystep-32'].asset);
  });
  it('resolves saved cable nodes and new catalogue nodes without guessing from editable names', () => {
    expect(nodeHardwareId('track-3-fm1-nrpn-test', {})).toBe('fm1-nrpn-test');
    expect(nodeHardwareId('node-8', { presetId: 'repo:ep-136' })).toBe('ep-136');
    expect(nodeHardwareId('node-8', { hardwareId: 'livetrak' })).toBe('livetrak');
    expect(nodeHardwareId('node-8', { isHapax: true })).toBe('hapax');
    expect(nodeHardwareId('track-3-unknown', {})).toBe('');
    expect(hardwareVisual('constructor')).toBeUndefined();
    expect(renderToStaticMarkup(createElement(DeviceHardware, { id: 'unknown', title: 'Nuevo equipo' }))).toContain('pendiente de documentar');
  });
});
