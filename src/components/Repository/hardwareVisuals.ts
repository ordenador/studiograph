export type HardwareVisual = { model: string; asset?: string; source: string; note?: string };

// Explicit catalogue IDs: do not guess equipment from editable titles/track names.
export const HARDWARE_VISUALS: Record<string, HardwareVisual> = {
  hapax: { model: 'Squarp Hapax', source: 'https://squarp.net/hapax/' },
  '0-coast': { model: 'Make Noise 0-Coast', asset: '0-coast', source: 'https://www.makenoisemusic.com/synthesizers-and-controllers/0-coast/' },
  spectravox: { model: 'Moog Spectravox', asset: 'spectravox', source: 'https://www.moogmusic.com/synthesizers/spectravox/' },
  'ep-133': { model: 'Teenage Engineering EP-133 K.O. II', asset: 'ep-133', source: 'https://teenage.engineering/products/ep-133' },
  'ep-136': { model: 'Teenage Engineering EP-136 K.O.-sidekick', asset: 'ep-136', source: 'https://teenage.engineering/products/ep-136' },
  'op1-field': { model: 'Teenage Engineering OP-1 field', asset: 'op1-field', source: 'https://teenage.engineering/products/op-1' },
  'fm1-a': { model: 'M-VAVE FM-1', asset: 'fm1', source: 'https://www.cuvave.com/product?id=fm-1', note: 'Unidad A · apariencia y firmware de esta unidad sin cotejar.' },
  'fm1-b': { model: 'M-VAVE FM-1', asset: 'fm1', source: 'https://www.cuvave.com/product?id=fm-1', note: 'Unidad B · apariencia y firmware de esta unidad sin cotejar.' },
  'fm1-nrpn-test': { model: 'M-VAVE FM-1', asset: 'fm1', source: 'https://www.cuvave.com/product?id=fm-1', note: 'Referencia de ensayo de una unidad A/B pendiente de identificar; no es una tercera unidad.' },
  'quad-cortex': { model: 'Neural DSP Quad Cortex', asset: 'quad-cortex', source: 'https://neuraldsp.com/quad-cortex' },
  'keystep-32': { model: 'Arturia KeyStep 32 mk2', asset: 'keystep-32', source: 'https://www.arturia.com/products/hybrid-synths/keystep-mk2/keystep-32-mk2' },
  'keystep-37': { model: 'Arturia KeyStep 37 mk2', asset: 'keystep-37', source: 'https://www.arturia.com/products/hybrid-synths/keystep-mk2/keystep-37-mk2' },
  livetrak: { model: 'Zoom LiveTrak L6max', asset: 'livetrak', source: 'https://zoomcorp.com/en/us/digital-mixer-multi-track-recorders/digital-mixer-recorder/livetrak-l6max/' },
  'bogen-gdu150': { model: 'Bogen GDU150', asset: 'bogen-gdu150', source: 'https://www.bogen.com/sites/default/files/2021-01/microphones_specsheet.pdf' },
};

export function hardwareVisual(id: string) { return Object.hasOwn(HARDWARE_VISUALS, id) ? HARDWARE_VISUALS[id] : undefined; }
export function hardwareAssetUrl(asset: string) { return `${import.meta.env.BASE_URL}hardware/${asset}.svg`; }

// Match the SVG viewBoxes so a wide instrument does not sit inside a tall,
// empty detail preview. Compact gallery/canvas previews keep their own height.
export const HARDWARE_ASPECT_RATIOS: Record<string, string> = {
  hapax: '1000 / 555', '0-coast': '700 / 420', spectravox: '960 / 410',
  'ep-133': '360 / 500', 'ep-136': '290 / 590', 'op1-field': '1000 / 360',
  fm1: '650 / 390', 'quad-cortex': '700 / 470',
  'keystep-32': '960 / 300', 'keystep-37': '1130 / 300',
  livetrak: '1000 / 380', 'bogen-gdu150': '700 / 150',
};

/** Old saved cable designs keep the catalogue ID in their node ID or preset. */
export function nodeHardwareId(nodeId: string, data: { hardwareId?: string; presetId?: string; isHapax?: boolean }) {
  if (data.isHapax) return 'hapax';
  const id = data.hardwareId || (data.presetId?.startsWith('repo:') ? data.presetId.slice(5) : /^track-\d+-(.+)$/.exec(nodeId)?.[1]) || '';
  return hardwareVisual(id) ? id : '';
}
