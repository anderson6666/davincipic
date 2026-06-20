import { useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { useNodeStore } from '@/store/useNodeStore';
import { NODE_TYPE_CONFIG, type NodeType } from '@/types';

// 节点类型图标映射
const nodeIcons: Record<string, LucideIcon> = {
  primary: SlidersHorizontal,
  colorWheel: SlidersHorizontal,
  curves: SlidersHorizontal,
  secondary: SlidersHorizontal,
  qualifier: SlidersHorizontal,
  powerWindow: SlidersHorizontal,
  tracking: SlidersHorizontal,
  rgbMixer: SlidersHorizontal,
  lut: SlidersHorizontal,
  colorMatch: SlidersHorizontal,
  noiseReduce: SlidersHorizontal,
};

export default function RightPanel() {
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { nodes, edges, addNode } = useNodeStore();

  // 转换为 ReactFlow 格式
  const flowNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: 'default',
    position: node.position,
    data: {
      label: (
        <div className="px-2 py-1">
          <div className="text-xs font-mono text-studio-text">{node.name}</div>
          <div className="text-[10px] text-studio-text-dim">
            {NODE_TYPE_CONFIG[node.type]?.label || node.type}
          </div>
        </div>
      ),
    },
    style: {
      background: '#1a1a1a',
      border: `1.5px solid ${NODE_TYPE_CONFIG[node.type]?.color || '#3a3a3a'}`,
      borderRadius: '6px',
      minWidth: 140,
    },
  }));

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    style: { stroke: '#2a2a2a', strokeWidth: 1.5 },
  }));

  const handleAddNode = (type: NodeType) => {
    addNode(type);
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  return (
    <aside className="w-[360px] bg-studio-panel border-l border-studio-border flex flex-col overflow-hidden">
      {/* 节点添加工具栏 */}
      <div className="border-b border-studio-border">
        <button
          onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-studio-surface transition-colors"
        >
          <span className="font-mono text-studio-text-dim uppercase tracking-wider flex items-center gap-2">
            <Plus size={14} />
            添加节点
          </span>
          {isToolbarExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {isToolbarExpanded && (
          <div className="px-4 pb-3 space-y-2 max-h-48 overflow-auto">
            {/* 一级调色 */}
            <div>
              <p className="text-[10px] text-studio-text-muted mb-1.5 font-mono">一级调色</p>
              <div className="flex flex-wrap gap-1.5">
                {(['primary', 'colorWheel', 'curves'] as NodeType[]).map((type) => {
                  const config = NODE_TYPE_CONFIG[type];
                  const Icon = nodeIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleAddNode(type)}
                      className="px-2.5 py-1.5 text-xs rounded bg-studio-surface border border-studio-border hover:border-opacity-60 transition-all flex items-center gap-1.5"
                      style={{ borderColor: `${config.color}30` }}
                    >
                      <Icon size={12} style={{ color: config.color }} />
                      <span style={{ color: config.color }}>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 二级调色 */}
            <div>
              <p className="text-[10px] text-studio-text-muted mb-1.5 font-mono">二级调色</p>
              <div className="flex flex-wrap gap-1.5">
                {(['secondary', 'qualifier', 'powerWindow', 'tracking'] as NodeType[]).map(
                  (type) => {
                    const config = NODE_TYPE_CONFIG[type];
                    const Icon = nodeIcons[type];
                    return (
                      <button
                        key={type}
                        onClick={() => handleAddNode(type)}
                        className="px-2.5 py-1.5 text-xs rounded bg-studio-surface border border-studio-border hover:border-opacity-60 transition-all flex items-center gap-1.5"
                        style={{ borderColor: `${config.color}30` }}
                      >
                        <Icon size={12} style={{ color: config.color }} />
                        <span style={{ color: config.color }}>{config.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 效果处理 */}
            <div>
              <p className="text-[10px] text-studio-text-muted mb-1.5 font-mono">效果处理</p>
              <div className="flex flex-wrap gap-1.5">
                {(['rgbMixer', 'lut', 'colorMatch', 'noiseReduce'] as NodeType[]).map(
                  (type) => {
                    const config = NODE_TYPE_CONFIG[type];
                    const Icon = nodeIcons[type];
                    return (
                      <button
                        key={type}
                        onClick={() => handleAddNode(type)}
                        className="px-2.5 py-1.5 text-xs rounded bg-studio-surface border border-studio-border hover:border-opacity-60 transition-all flex items-center gap-1.5"
                        style={{ borderColor: `${config.color}30` }}
                      >
                        <Icon size={12} style={{ color: config.color }} />
                        <span style={{ color: config.color }}>{config.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 节点编辑器区域 - 高度约55% */}
      <div className="flex-1 min-h-0" style={{ height: '55%' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          fitView
          attributionPosition="bottom-left"
          style={{
            background: '#0d0d0d',
          }}
        >
          <Background color="#2a2a2a" gap={20} size={1} />
          <Controls
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
            }}
          />
          <MiniMap
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
            nodeColor={(node) =>
              (nodes.find((n) => n.id === node.id)?.type &&
                NODE_TYPE_CONFIG[nodes.find((n) => n.id === node.id)!?.type]?.color) ||
              '#3a3a3a'
            }
          />
        </ReactFlow>
      </div>

      {/* 参数调节面板 */}
      <div className="border-t border-studio-border h-[45%] overflow-auto p-4">
        {selectedNode ? (
          <div className="space-y-4">
            <h3 className="text-sm font-mono text-studio-text flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-studio-accent" />
              参数调节 - {selectedNode.name}
            </h3>
            <div className="space-y-3">
              {Object.entries(selectedNode.params).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-studio-text-dim block mb-1">{key}</label>
                  <input
                    type="range"
                    value={typeof value === 'number' ? value : 50}
                    onChange={(e) => {
                      // TODO: 实现参数更新逻辑
                      console.log('更新参数:', key, e.target.value);
                    }}
                    className="w-full h-1 bg-studio-border rounded appearance-none cursor-pointer accent-studio-accent"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-studio-text-muted">
            <p>选择一个节点以查看和调整参数</p>
          </div>
        )}
      </div>
    </aside>
  );
}
