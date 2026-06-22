import { useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  SlidersHorizontal,
  GitBranch,
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

/** 节点分类定义（桌面端：隐藏一级调色） */
const NODE_CATEGORIES: { label: string; types: NodeType[]; hidden?: boolean }[] = [
  { label: '一级调色', types: ['primary'], hidden: true },
  { label: '一级校色', types: ['colorWheel', 'curves'] },
  { label: '二级调色', types: ['secondary'] },
  { label: '二级调色工具', types: ['qualifier', 'powerWindow', 'tracking'] },
  { label: '效果处理', types: ['lut', 'colorMatch', 'noiseReduce'] },
  { label: 'RGB混合器', types: ['rgbMixer'] },
];

interface RightPanelProps {
  mobile?: boolean;
}

export default function RightPanel({ mobile }: RightPanelProps) {
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
    <aside className={`${mobile ? 'w-full' : 'w-[360px]'} bg-studio-panel ${mobile ? '' : 'border-l'} border-studio-border flex flex-col overflow-hidden`}>
      {/* ===== 节点分类列表（桌面端和移动端均隐藏，仅保留编辑器和参数面板） ===== */}

      {/* ===== 节点编辑器区域 ===== */}
      <div className="flex-1 min-h-0 relative" style={{ height: mobile ? '45%' : '55%' }}>
        {/* 编辑器标题条 */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 bg-gradient-to-b from-studio-panel to-transparent flex items-center gap-2 pointer-events-none">
          <GitBranch size={12} className="text-studio-accent/70" />
          <span className="text-[10px] font-mono text-studio-text-muted uppercase tracking-[0.15em]">节点流程</span>
          <div className="flex-1 h-px bg-gradient-to-r from-studio-border to-transparent" />
          {nodes.length > 0 && (
            <span className="text-[10px] font-mono text-studio-text-muted">{nodes.length}</span>
          )}
        </div>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          fitView
          attributionPosition="bottom-left"
          style={{
            background: '#0a0b0e',
          }}
        >
          <Background color="#232730" gap={20} size={1} />
          <Controls
            style={{
              background: 'rgba(17, 19, 24, 0.92)',
              border: '1px solid #232730',
              borderRadius: '8px',
            }}
          />
          <MiniMap
            style={{
              background: 'rgba(17, 19, 24, 0.92)',
              border: '1px solid #232730',
              borderRadius: '8px',
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
      <div className="border-t border-studio-border h-[45%] overflow-auto p-4 bg-studio-bg/30">
        {selectedNode ? (
          <div className="space-y-4">
            <h3 className="text-sm font-mono text-studio-text flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-studio-accent/10 flex items-center justify-center">
                <SlidersHorizontal size={12} className="text-studio-accent" />
              </div>
              参数调节
              <span className="text-studio-text-muted text-xs">/ {selectedNode.name}</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(selectedNode.params).map(([key, value]) => (
                <div key={key} className="bg-studio-surface/40 rounded-lg p-3 border border-studio-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-studio-text-dim font-mono">{key}</label>
                    <span className="text-[10px] text-studio-accent font-mono tabular-nums">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                  </div>
                  <input
                    type="range"
                    value={typeof value === 'number' ? value : 50}
                    onChange={(e) => {
                      console.log('更新参数:', key, e.target.value);
                    }}
                    className="w-full h-1 bg-studio-border rounded appearance-none cursor-pointer accent-studio-accent"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-studio-surface/60 border border-studio-border flex items-center justify-center">
              <SlidersHorizontal size={22} className="text-studio-text-muted/50" />
            </div>
            <div>
              <p className="text-sm text-studio-text-dim mb-1">选择一个节点</p>
              <p className="text-[11px] text-studio-text-muted">点击上方流程图中的节点以查看和调整参数</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
