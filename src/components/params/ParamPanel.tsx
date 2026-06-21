import { useNodeStore } from '../../store/useNodeStore';
import { NODE_TYPE_CONFIG, type NodeType } from '../../types';
import PrimaryParamsPanel from './PrimaryParamsPanel';
import ColorWheelParamsPanel from './ColorWheelParamsPanel';
import CurveParamsPanel from './CurveParamsPanel';
import SecondaryParamsPanel from './SecondaryParamsPanel';
import QualifierParamsPanel from './QualifierParamsPanel';
import PowerWindowParamsPanel from './PowerWindowParamsPanel';
import TrackingParamsPanel from './TrackingParamsPanel';
import RGBMixerParamsPanel from './RGBMixerParamsPanel';
import LUTParamsPanel from './LUTParamsPanel';
import ColorMatchParamsPanel from './ColorMatchParamsPanel';
import NoiseReduceParamsPanel from './NoiseReduceParamsPanel';
import { SlidersHorizontal, Power } from 'lucide-react';

const panelMap: Record<NodeType, React.ComponentType<{ nodeId: string }>> = {
  primary: PrimaryParamsPanel,
  colorWheel: ColorWheelParamsPanel,
  curves: CurveParamsPanel,
  secondary: SecondaryParamsPanel,
  qualifier: QualifierParamsPanel,
  powerWindow: PowerWindowParamsPanel,
  tracking: TrackingParamsPanel,
  rgbMixer: RGBMixerParamsPanel,
  lut: LUTParamsPanel,
  colorMatch: ColorMatchParamsPanel,
  noiseReduce: NoiseReduceParamsPanel,
};

export default function ParamPanel() {
  const selectedNodeId = useNodeStore((s) => s.selectedNodeId);
  const nodes = useNodeStore((s) => s.nodes);
  const updateNodeEnabled = useNodeStore((s) => s.updateNodeEnabled);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-studio-text-muted">
        <SlidersHorizontal size={32} className="mb-3 opacity-30" />
        <p className="text-sm">选择一个节点以编辑参数</p>
      </div>
    );
  }

  const config = NODE_TYPE_CONFIG[selectedNode.type];
  const PanelComponent = panelMap[selectedNode.type];

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div
        className="flex items-center gap-2 px-1 pb-3 border-b border-studio-border"
        style={{ borderLeft: `3px solid ${config.color}` }}
      >
        <Power size={12} style={{ color: config.color }} />
        <span className="text-sm font-medium text-studio-text truncate flex-1">
          {selectedNode.name}
        </span>
        <button
          onClick={() =>
            updateNodeEnabled(selectedNode.id, !selectedNode.enabled)
          }
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
            selectedNode.enabled ? 'bg-studio-accent/30' : 'bg-studio-border'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              selectedNode.enabled ? 'left-[18px]' : 'left-0.5'
            }`}
            style={{
              backgroundColor: selectedNode.enabled ? config.color : '#888',
            }}
          />
        </button>
      </div>

      {/* 参数内容 */}
      <div className="flex-1 overflow-y-auto py-3 px-1">
        {PanelComponent && <PanelComponent nodeId={selectedNode.id} />}
      </div>
    </div>
  );
}
