import { memo, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps, type Node } from '@xyflow/react';
import {
  Cpu, Music, Trash2,
  Drum, Piano, Guitar, Mic, Speaker, Radio,
  Waves, Sliders, CircuitBoard, Box, Disc,
  Volume2, Headphones, Cable, Zap,
  type LucideIcon
} from 'lucide-react';
import type { InstrumentNodeData, Port, PortType } from '../../types';
import { PORT_COLORS } from '../../data/defaultNodes';
import { useStudioStore } from '../../store/useStudioStore';
import { traceHapaxRouting } from '../../utils/hapaxRouting';
import { DeviceHardware } from '../Repository/DeviceHardware';
import { nodeHardwareId } from '../Repository/hardwareVisuals';

// Map icon IDs to components
const ICON_MAP: Record<string, LucideIcon> = {
  music: Music,
  drum: Drum,
  piano: Piano,
  guitar: Guitar,
  mic: Mic,
  speaker: Speaker,
  radio: Radio,
  waves: Waves,
  sliders: Sliders,
  circuit: CircuitBoard,
  cpu: Cpu,
  box: Box,
  disc: Disc,
  volume: Volume2,
  headphones: Headphones,
  cable: Cable,
  zap: Zap,
};

const getIconComponent = (iconId: string | undefined): LucideIcon => {
  return ICON_MAP[iconId || 'music'] || Music;
};

function renderIcon(iconId: string | undefined, size: number, className: string) {
  const Icon = getIconComponent(iconId);
  return <Icon size={size} className={className} />;
}

type InstrumentNodeType = Node<InstrumentNodeData>;

function InstrumentNodeComponent({ id, data }: NodeProps<InstrumentNodeType>) {
  const { removeNode, setSelectedNode, updateNodeWidth, selectedNodeId, nodes, edges } = useStudioStore();
  const selected = selectedNodeId === id;
  const nodeData = data as InstrumentNodeData;
  const hardwareId = nodeHardwareId(id, nodeData);

  // Find ALL Hapax connections for this node (including multi-hop chains)
  const hapaxHandleLabels: Record<string, string> = {
    'midi-a': 'A', 'midi-b': 'B', 'midi-c': 'C', 'midi-d': 'D',
    'usb-host': 'USB-H', 'usb-device': 'USB-D',
    'cv-1': 'CV1', 'cv-2': 'CV2', 'cv-3': 'CV3', 'cv-4': 'CV4',
    'gate-1': 'G1', 'gate-2': 'G2', 'gate-3': 'G3', 'gate-4': 'G4',
  };
  const hapaxRouting = traceHapaxRouting(nodes, edges);
  const hapaxHandles = hapaxRouting.get(id) || [];
  const hapaxPort = hapaxHandles.length > 0
    ? hapaxHandles
        .map((h) => hapaxHandleLabels[h])
        .filter(Boolean)
        .join(', ')
    : null;
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.isRemovable !== false) {
      removeNode(id);
    }
  };

  const getHandleColor = (type: PortType, direction: 'input' | 'output') => {
    return PORT_COLORS[type]?.[direction] || PORT_COLORS.midi.input;
  };

  // Filter CV ports based on showCVPorts toggle
  const visibleInputs = nodeData.showCVPorts
    ? nodeData.inputs
    : nodeData.inputs.filter(p => p.type !== 'cv');
  const visibleOutputs = nodeData.showCVPorts
    ? nodeData.outputs
    : nodeData.outputs.filter(p => p.type !== 'cv');

  // Calculate fixed positions for handles based on port count
  const inputCount = visibleInputs.length;
  const outputCount = visibleOutputs.length;
  const maxPorts = Math.max(inputCount, outputCount);

  // Calculate node width based on max ports per side - Hapax gets extra width
  const minWidth = nodeData.isHapax ? 480 : 260;
  const portWidth = 44; // Width per port
  const autoWidth = Math.max(minWidth, maxPorts * 2 * portWidth + 40);
  const calculatedWidth = nodeData.width || autoWidth;

  // Keep ReactFlow's internal handle position cache in sync
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, calculatedWidth, inputCount, outputCount]);

  // Custom resize handler
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = nodeRef.current?.offsetWidth || calculatedWidth;
    const nodeMinWidth = minWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(nodeMinWidth, startWidth + deltaX);
      if (nodeRef.current) {
        nodeRef.current.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const deltaX = upEvent.clientX - startX;
      const newWidth = Math.max(nodeMinWidth, startWidth + deltaX);
      updateNodeWidth(id, newWidth);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [id, updateNodeWidth, calculatedWidth, minWidth]);

  const getHandleLeft = (index: number, total: number, isInput: boolean) => {
    if (total === 0) return '50%';

    // Calculate positions - inputs on left half, outputs on right half
    const halfWidth = calculatedWidth / 2;
    const spacing = halfWidth / (total + 1);

    if (isInput) {
      return spacing * (index + 1);
    } else {
      return halfWidth + spacing * (index + 1);
    }
  };

  // Neutral equipment surfaces; port colors carry the signal type.
  const getBorderClass = () => {
    if (selected) return 'border-white';
    if (nodeData.isHapax) return 'border-gray-400';
    return 'border-gray-600';
  };

  return (
    <div
      ref={nodeRef}
      onClick={handleClick}
      style={{ width: calculatedWidth, minWidth: minWidth }}
      className={`
        relative rounded-lg border
        ${nodeData.isHapax ? 'bg-gray-900' : 'bg-gray-800'}
        ${getBorderClass()}
      `}
    >

      {/* Input Handles (Top Left) */}
      {visibleInputs.map((port: Port, index: number) => {
        const leftPos = getHandleLeft(index, inputCount, true);
        return (
          <Handle
            key={port.id}
            type="target"
            position={Position.Top}
            id={port.id}
            className="!w-3 !h-3 !border-2"
            style={{
              left: typeof leftPos === 'number' ? `${leftPos}px` : leftPos,
              backgroundColor: getHandleColor(port.type, 'input').bg,
              borderColor: getHandleColor(port.type, 'input').border,
            }}
            title={`${port.label} (${port.type.toUpperCase()} IN)`}
          />
        );
      })}

      {/* Output Handles (Top Right) */}
      {visibleOutputs.map((port: Port, index: number) => {
        const leftPos = getHandleLeft(index, outputCount, false);
        return (
          <Handle
            key={port.id}
            type="source"
            position={Position.Top}
            id={port.id}
            className="!w-3 !h-3 !border-2"
            style={{
              left: typeof leftPos === 'number' ? `${leftPos}px` : leftPos,
              backgroundColor: getHandleColor(port.type, 'output').bg,
              borderColor: getHandleColor(port.type, 'output').border,
            }}
            title={`${port.label} (${port.type.toUpperCase()} OUT)`}
          />
        );
      })}

      {/* Port Labels - precisely aligned with handles */}
      {visibleInputs.map((port: Port, index: number) => {
        const leftPos = getHandleLeft(index, inputCount, true);
        return (
          <span
            key={`label-${port.id}`}
            className="absolute text-[8px] px-1 rounded whitespace-nowrap"
            style={{
              left: typeof leftPos === 'number' ? `${leftPos}px` : leftPos,
              transform: 'translateX(-50%)',
              top: '16px',
              backgroundColor: `${getHandleColor(port.type, 'input').bg}30`,
              color: getHandleColor(port.type, 'input').bg
            }}
          >
            {port.label}
          </span>
        );
      })}
      {visibleOutputs.map((port: Port, index: number) => {
        const leftPos = getHandleLeft(index, outputCount, false);
        return (
          <span
            key={`label-${port.id}`}
            className="absolute text-[8px] px-1 rounded whitespace-nowrap"
            style={{
              left: typeof leftPos === 'number' ? `${leftPos}px` : leftPos,
              transform: 'translateX(-50%)',
              top: '16px',
              backgroundColor: `${getHandleColor(port.type, 'output').bg}30`,
              color: getHandleColor(port.type, 'output').bg
            }}
          >
            {port.label}
          </span>
        );
      })}

      {/* Spacer for port labels */}
      <div style={{ height: '32px' }}></div>

      {/* Header */}
      <div className={`
        px-3 py-2 flex items-center justify-between
        bg-gray-700/50
      `}>
        <div className="flex items-center gap-2">
          {nodeData.isHapax
            ? <Cpu size={18} className="text-gray-300" />
            : renderIcon(nodeData.iconId, 16, "text-blue-400")
          }
          <div>
            <div title={nodeData.name} className={`font-semibold text-white truncate ${nodeData.isHapax ? 'text-base' : 'text-sm'}`}>
              {nodeData.name}
            </div>
            <div className="text-[10px] text-gray-400">{nodeData.manufacturer}</div>
          </div>
        </div>
        {nodeData.isRemovable !== false && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Quitar bloque"
            aria-label={`Quitar bloque ${nodeData.name}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-1">
        {hardwareId && <DeviceHardware id={hardwareId} compact />}
        {!nodeData.isHapax && (
          <div className="flex items-center gap-2 text-xs">
            {hapaxPort && (
              <>
                <span className="text-gray-500">Hapax:</span>
                <span className="text-purple-400 font-mono">{hapaxPort}</span>
              </>
            )}
            {[...nodeData.inputs, ...nodeData.outputs].some(p => p.type === 'midi' || p.type === 'usb') && <><span className="text-gray-500">CH:</span>
            <span className="text-white font-mono">{nodeData.channel}</span></>}
            <span className="text-gray-500 ml-2">Type:</span>
            <span className="text-white">{nodeData.type}</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-1 flex-wrap">
          {nodeData.ccMap && nodeData.ccMap.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300">
              CC ({nodeData.ccMap.length})
            </span>
          )}
          {nodeData.nrpnMap && nodeData.nrpnMap.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900 text-yellow-300">
              NRPN ({nodeData.nrpnMap.length})
            </span>
          )}
          {nodeData.assignCCs && nodeData.assignCCs.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-300">
              ASSIGN ({nodeData.assignCCs.length})
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-1 border-t border-gray-700 flex gap-2 flex-wrap text-[8px] text-gray-500">
        {(['midi', 'audio', 'cv', 'usb'] as const).flatMap(type => (['inputs', 'outputs'] as const).map(direction =>
          nodeData[direction].some(p => p.type === type) && <span key={`${type}:${direction}`} style={{ color: PORT_COLORS[type][direction === 'inputs' ? 'input' : 'output'].bg }}>
            {type.toUpperCase()} {direction === 'inputs' ? 'In' : 'Out'}
          </span>))}
        {!nodeData.inputs.length && !nodeData.outputs.length && <span>Puertos por definir</span>}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="nodrag absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #4b5563 50%)',
          borderBottomRightRadius: '6px',
        }}
        title="Drag to resize"
      />
    </div>
  );
}

export const InstrumentNode = memo(InstrumentNodeComponent);
