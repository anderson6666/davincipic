import { Handle, Position, NodeProps } from '@xyflow/react';
import type { BaseNode } from '../../../types';
import { NODE_TYPE_CONFIG } from '../../../types';
import { Move } from 'lucide-react';

export function TrackingNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BaseNode;
  const config = NODE_TYPE_CONFIG[nodeData.type];

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header" style={{ borderLeft: `3px solid ${config.color}` }}>
        <Move size={12} style={{ color: config.color }} />
        <span>{config.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#666' }}>
          {nodeData.enabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="node-body">
        跟踪区域
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default TrackingNode;
