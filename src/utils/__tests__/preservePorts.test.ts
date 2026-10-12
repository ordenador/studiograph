import { expect, it } from 'vitest';
import { preservePortIds } from '../preservePorts';
import type { Port } from '../../types';

it('keeps existing custom input IDs and CV/Gate labels on map-only edits', () => {
  const old: Port[] = [{ id: 'in-0', label: 'CV In', type: 'cv' }, { id: 'in-1', label: 'Gate In', type: 'cv' }];
  const generated: Port[] = [{ id: 'cv-in-1', label: 'CV In 1', type: 'cv' }, { id: 'cv-in-2', label: 'CV In 2', type: 'cv' }];
  expect(preservePortIds(old, generated)).toEqual(old);
});
it('keeps thru separate from normal outputs and avoids generated ID collisions', () => {
  const old: Port[] = [{ id: 'midi-out-2', label: 'Out', type: 'midi' }, { id: 'thru', label: 'Thru', type: 'midi' }];
  const generated: Port[] = [{ id: 'midi-out-1', label: 'Out 1', type: 'midi' }, { id: 'midi-out-2', label: 'Out 2', type: 'midi' }, { id: 'midi-thru-1', label: 'Thru', type: 'midi' }];
  const result = preservePortIds(old, generated);
  expect(result[0]).toEqual(old[0]);expect(result[2]).toEqual(old[1]);
  expect(new Set(result.map(p => p.id)).size).toBe(3);
});
