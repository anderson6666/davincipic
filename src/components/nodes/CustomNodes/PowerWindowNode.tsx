import { Handle, Position, NodeProps } from '@xyflow/react';
import type { BaseNode } from '../../../types';
import { NODE_TYPE_CONFIG } from '../../../types';
import { Circle } from 'lucide-react';

export function PowerWindowNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BaseNode;
  const config = NODE_TYPE_CONFIG[nodeData.type];
  const params = nodeData.params as { shape: string; size: number };

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header" style={{ borderLeft: `3px solid ${config.color}` }}>
        <Circle size={12} style={{ color: config.color }} />
        <span>{config.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#666' }}>
          {nodeData.enabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="node-body">
        形状: {params.shape} 大小: {params.size}%
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default PowerWindowNode;
