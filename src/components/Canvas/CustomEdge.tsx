import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  selected,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const routing = data as { corridorX?: number; routingOffset?: number } | undefined;
  const [curvedPath] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.3 });
  const offset = routing?.routingOffset || 0;
  const edgePath = routing?.corridorX !== undefined
    ? `M${sourceX} ${sourceY} V${sourceY + 45 + offset} H${routing.corridorX} V${targetY - 55} H${targetX} V${targetY}` : curvedPath;

  // Apply selected styling
  const selectedStyle = selected
    ? {
        ...style,
        strokeWidth: 4,
        stroke: '#fff',
      }
    : style;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={selectedStyle}
      markerEnd={markerEnd}
    />
  );
}
