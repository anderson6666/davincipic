import { Handle, Position, NodeProps } from '@xyflow/react';
import type { BaseNode } from '../../../types';
import { NODE_TYPE_CONFIG } from '../../../types';
import { Waves } from 'lucide-react';

export function NoiseReduceNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BaseNode;
  const config = NODE_TYPE_CONFIG[nodeData.type];
  const params = nodeData.params as { spatialRadius: number; strength: number };

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />

      <div className="node-header" style={{ borderLeft: `3px solid ${config.color}` }}>
        <Waves size={12} style={{ color: config.color }} />
        <span>{config.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#666' }}>
          {nodeData.enabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="node-body">
        半径:{params.spatialRadius} 强度:{(params.strength * 100).toFixed(0)}%
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default NoiseReduceNode;
