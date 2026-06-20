import { create } from 'zustand';
import type { BaseNode, EdgeData, NodeType } from '../types';
import { getDefaultParams, NODE_TYPE_CONFIG } from '../types';

interface NodeState {
  nodes: BaseNode[];
  edges: EdgeData[];
  selectedNodeId: string | null;
}

interface NodeActions {
  addNode: (type: NodeType, position?: { x: number; y: number }, initialParams?: Record<string, any>) => string;
  removeNode: (id: string) => void;
  updateNodeParam: <T extends keyof any>(id: string, key: T, value: any) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeEnabled: (id: string, enabled: boolean) => void;
  setSelectedNode: (id: string | null) => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  disconnectNodes: (edgeId: string) => void;
  setNodes: (nodes: BaseNode[]) => void;
  setEdges: (edges: EdgeData[]) => void;
  clearAll: () => void;
}

let nodeIdCounter = 0;
let edgeIdCounter = 0;

function generateNodeId(): string {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}

function generateEdgeId(): string {
  return `edge_${Date.now()}_${++edgeIdCounter}`;
}

export const useNodeStore = create<NodeState & NodeActions>()((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  addNode: (type, position, initialParams) => {
    const id = generateNodeId();
    const config = NODE_TYPE_CONFIG[type];
    const defaultParams = getDefaultParams(type);
    const mergedParams = initialParams ? { ...defaultParams, ...initialParams } : defaultParams;
    const newNode: BaseNode = {
      id,
      type,
      position: position ?? { x: Math.random() * 400 + 100, y: Math.random() * 300 + 50 },
      enabled: true,
      name: config.label,
      params: mergedParams,
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    return id;
  },

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  updateNodeParam: (id, key, value) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, params: { ...node.params, [key]: value } }
          : node
      ),
    })),

  updateNodePosition: (id, position) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node
      ),
    })),

  updateNodeEnabled: (id, enabled) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, enabled } : node
      ),
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  connectNodes: (sourceId, targetId) => {
    const { edges } = get();
    const existingEdge = edges.find(
      (e) => e.source === sourceId && e.target === targetId
    );
    if (existingEdge) return;

    const newEdge: EdgeData = {
      id: generateEdgeId(),
      source: sourceId,
      target: targetId,
    };
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },

  disconnectNodes: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  clearAll: () => set({ nodes: [], edges: [], selectedNodeId: null }),
}));
