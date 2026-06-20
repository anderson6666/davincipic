import { Handle, Position, NodeProps } from '@xyflow/react';
import type { BaseNode } from '../../../types';
import { NODE_TYPE_CONFIG } from '../../../types';
import { GitBranch } from 'lucide-react';

export function CurveNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BaseNode;
  const config = NODE_TYPE_CONFIG[nodeData.type];
  const params = nodeData.params as { master: { x: number; y: number }[] };
  const pointCount = params.master?.length ?? 0;

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header" style={{ borderLeft: `3px solid ${config.color}` }}>
        <GitBranch size={12} style={{ color: config.color }} />
        <span>{config.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#666' }}>
          {nodeData.enabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="node-body">
        控制点数: {pointCount}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default CurveNode;
