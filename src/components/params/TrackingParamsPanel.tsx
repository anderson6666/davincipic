import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';

interface Props {
  nodeId: string;
}

export default function TrackingParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));

  if (!node) return null;
  const p = node.params as {
    trackArea: { x: number; y: number; w: number; h: number };
    sensitivity: number;
  };

  return (
    <div className="space-y-4">
      {/* 跟踪区域 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">跟踪区域</p>
        <div className="space-y-1 pl-1">
          <ParamSlider
            label="X"
            value={p.trackArea.x}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'trackArea', { ...p.trackArea, x: v })}
          />
          <ParamSlider
            label="Y"
            value={p.trackArea.y}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'trackArea', { ...p.trackArea, y: v })}
          />
          <ParamSlider
            label="宽度"
            value={p.trackArea.w}
            min={1}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'trackArea', { ...p.trackArea, w: v })}
          />
          <ParamSlider
            label="高度"
            value={p.trackArea.h}
            min={1}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'trackArea', { ...p.trackArea, h: v })}
          />
        </div>
      </div>

      {/* 灵敏度 */}
      <ParamSlider
        label="灵敏度"
        value={p.sensitivity}
        min={0}
        max={100}
        step={1}
        onChange={(v) => updateParam(nodeId, 'sensitivity', v)}
      />
    </div>
  );
}
