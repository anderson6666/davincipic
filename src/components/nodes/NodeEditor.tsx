import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnConnect,
  applyNodeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNodeStore } from '../../store/useNodeStore';
import type { BaseNode } from '../../types';
import { PrimaryNode } from './CustomNodes/PrimaryNode';
import { ColorWheelNode } from './CustomNodes/ColorWheelNode';
import { CurveNode } from './CustomNodes/CurveNode';
import { SecondaryNode } from './CustomNodes/SecondaryNode';
import { QualifierNode } from './CustomNodes/QualifierNode';
import { PowerWindowNode } from './CustomNodes/PowerWindowNode';
import { TrackingNode } from './CustomNodes/TrackingNode';
import { RGBMixerNode } from './CustomNodes/RGBMixerNode';
import { LUTNode } from './CustomNodes/LUTNode';
import { ColorMatchNode } from './CustomNodes/ColorMatchNode';
import { NoiseReduceNode } from './CustomNodes/NoiseReduceNode';
import { AddNodeMenu } from './AddNodeMenu';

const nodeTypes = {
  primary: PrimaryNode,
  colorWheel: ColorWheelNode,
  curves: CurveNode,
  secondary: SecondaryNode,
  qualifier: QualifierNode,
  powerWindow: PowerWindowNode,
  tracking: TrackingNode,
  rgbMixer: RGBMixerNode,
  lut: LUTNode,
  colorMatch: ColorMatchNode,
  noiseReduce: NoiseReduceNode,
};

function convertToFlowNodes(nodes: BaseNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n as unknown as Record<string, unknown>,
  }));
}

function convertToFlowEdges(edges: ReturnType<typeof useNodeStore.getState>['edges']): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    style: { stroke: '#00d4ff', strokeWidth: 2 },
  }));
}

export function NodeEditor() {
  const nodes = useNodeStore((s) => s.nodes);
  const edges = useNodeStore((s) => s.edges);
  const setSelectedNode = useNodeStore((s) => s.setSelectedNode);
  const connectNodes = useNodeStore((s) => s.connectNodes);
  const updateNodePosition = useNodeStore((s) => s.updateNodePosition);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const lastClickTime = useRef(0);

  const flowNodes = convertToFlowNodes(nodes);
  const flowEdges = convertToFlowEdges(edges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const updated = applyNodeChanges(changes, flowNodes);
      for (const node of updated) {
        if (node.position) {
          updateNodePosition(node.id, node.position);
        }
      }
    },
    [flowNodes, updateNodePosition]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      connectNodes(connection.source, connection.target);
    },
    [connectNodes]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime.current < 300) {
        setMenuPosition({ x: event.clientX, y: event.clientY });
        setMenuOpen(true);
      } else {
        setSelectedNode(null);
      }
      lastClickTime.current = now;
    },
    [setSelectedNode]
  );

  return (
    <div className="node-editor-wrapper" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        fitView
        defaultEdgeOptions={{ style: { stroke: '#00d4ff', strokeWidth: 2 } }}
      >
        <Controls />
        <MiniMap nodeColor={(n) => (n.data?.type ? NODE_COLOR_MAP[n.data.type as keyof typeof NODE_COLOR_MAP] ?? '#4ade80' : '#4ade80')} />
        <Background gap={20} color="#1a1a1a" />
      </ReactFlow>

      <button
        className="add-node-btn"
        onClick={(e) => {
          setMenuPosition({ x: e.clientX, y: e.clientY });
          setMenuOpen(true);
        }}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 100,
          padding: '8px 16px',
          background: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: 6,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        + 添加节点
      </button>

      <AddNodeMenu open={menuOpen} onClose={() => setMenuOpen(false)} position={menuPosition} />
    </div>
  );
}

const NODE_COLOR_MAP: Record<string, string> = {
  primary: '#4ade80',
  colorWheel: '#4ade80',
  curves: '#4ade80',
  secondary: '#a855f7',
  qualifier: '#a855f7',
  powerWindow: '#a855f7',
  tracking: '#a855f7',
  rgbMixer: '#3b82f6',
  lut: '#3b82f6',
  colorMatch: '#3b82f6',
  noiseReduce: '#3b82f6',
};
