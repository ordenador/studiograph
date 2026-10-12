import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HapaxHardware } from './HapaxHardware';

describe('Hapax hardware reference', () => {
  it('makes only output-capable connectors keyboard actions', () => {
    const svg = renderToStaticMarkup(createElement(HapaxHardware, { onPortClick: () => {} }));
    const actions = [...svg.matchAll(/<g[^>]*role="button"[^>]*>/g)].map((match) => match[0]);
    expect(actions).toHaveLength(14);
    expect(actions.every((tag) => tag.includes('tabindex="0"'))).toBe(true);
    expect(actions.every((tag) => tag.includes('data-port="'))).toBe(true);
    expect(actions.some((tag) => tag.includes('MIDI in') || tag.includes('CV in'))).toBe(false);
    expect(actions.filter((tag) => tag.includes('bidireccional'))).toHaveLength(2);
  });

  it('marks both physical jacks for a combined CV/Gate route', () => {
    const svg = renderToStaticMarkup(createElement(HapaxHardware, { activePorts: ['CVG1'] }));
    expect(svg).toContain('aria-label="CV out 1 · configurado en el setup"');
    expect(svg).toContain('aria-label="Gate out 1 · configurado en el setup"');
    expect(svg).not.toContain('aria-label="CV out 2 · configurado en el setup"');
    expect(svg).not.toContain('aria-label="MIDI out A · DIN · configurado en el setup"');
  });

  it('does not claim configuration or expose actions for an unassigned read-only reference', () => {
    const svg = renderToStaticMarkup(createElement(HapaxHardware, { activePorts: ['NULL'] }));
    expect(svg).not.toContain('configurado en el setup');
    expect(svg).not.toContain('role="button"');
    expect(svg).toContain('No indica conexión física ni actividad MIDI');
  });

  it('keeps the top view neutral and noninteractive despite configured routes', () => {
    const svg = renderToStaticMarkup(createElement(HapaxHardware, {
      view: 'top', activePorts: ['A'], onPortClick: () => {},
    }));
    expect(svg).not.toContain('role="button"');
    expect(svg).not.toContain('data-port=');
    expect(svg).toContain('Sin notas ni actividad de reproducción representadas');
    expect(svg).toContain('Pantalla de parámetros');
    expect(svg).toContain('Pantalla de menú');
  });
});
