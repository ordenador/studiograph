import type { Node, Edge } from '@xyflow/react';
import type { Device, Setup, Track } from './repository';
import { portLabel } from './repository';
export type DeviceData = { title: string; tracks: Track[]; hapax?: boolean; firmware?: string };
export type DeviceNode = Node<DeviceData, 'repositoryDevice'>;

export function buildDiagram(setup: Setup, devices: Device[]) {
  const used = [...new Set(setup.tracks.map(t => t.device))];
  const nodes: DeviceNode[] = [{ id: 'hapax', type: 'repositoryDevice', position: setup.studio_layout?.hapax || { x: 0, y: 100 },
    data: { title: 'Squarp Hapax', hapax: true, tracks: setup.tracks } }];
  const edges: Edge[] = [];
  used.forEach((id, index) => {
    const tracks = setup.tracks.filter(t => t.device === id);
    const device = devices.find(d => d.id === id);
    nodes.push({ id: `device:${id}`, type: 'repositoryDevice',
      position: setup.studio_layout?.[`device:${id}`] || { x: 420 + (index % 2) * 330, y: Math.floor(index / 2) * 230 },
      data: { title: device?.title || id, firmware: device?.firmware || 'unknown', tracks } });
    for (const p of [...new Set(tracks.map(t => t.port).filter(p => p !== 'NULL'))]) {
      edges.push({ id: `${p}:${id}`, source: 'hapax', target: `device:${id}`, sourceHandle: p,
        targetHandle: p, type: 'smoothstep', label: tracks.filter(t => t.port === p).map(t => t.channel ? `CH ${t.channel}` : portLabel(p)).join(', '),
        style: { stroke: p.startsWith('CV') || p.startsWith('G') ? '#eab308' : p.startsWith('USB') ? '#22d3ee' : '#9ca3af', strokeWidth: 1.5 },
        labelStyle: { fill: '#e5e7eb', fontSize: 11 }, labelBgStyle: { fill: '#1f2937' } });
    }
  });
  return { nodes, edges };
}

