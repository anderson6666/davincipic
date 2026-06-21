import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface Props {
  nodeId: string;
}

export default function QualifierParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));

  if (!node) return null;
  const p = node.params as {
    hueRange: [number, number];
    satRange: [number, number];
    lumRange: [number, number];
    softness: number;
    invert: boolean;
  };

  return (
    <div className="space-y-4">
      {/* 色相范围 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">色相范围</p>
        <div className="space-y-1 pl-1">
          <ParamSlider
            label="最小"
            value={p.hueRange[0]}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(v) => updateParam(nodeId, 'hueRange', [v, p.hueRange[1]])}
          />
          <ParamSlider
            label="最大"
            value={p.hueRange[1]}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(v) => updateParam(nodeId, 'hueRange', [p.hueRange[0], v])}
          />
        </div>
      </div>

      {/* 饱和度范围 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">饱和度范围</p>
        <div className="space-y-1 pl-1">
          <ParamSlider
            label="最小"
            value={p.satRange[0]}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'satRange', [v, p.satRange[1]])}
          />
          <ParamSlider
            label="最大"
            value={p.satRange[1]}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'satRange', [p.satRange[0], v])}
          />
        </div>
      </div>

      {/* 亮度范围 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">亮度范围</p>
        <div className="space-y-1 pl-1">
          <ParamSlider
            label="最小"
            value={p.lumRange[0]}
            min={0}
            max={100}
            step={1}
            onChange={(v) => updateParam(nodeId, 'lumRange', [v, p.lumRange[1]])}
          />
          <ParamSlider
            label="最大"
            value={p.lumRange[1]}
            min={0}
            max={100}
            step={1}
            onChange={(v) => updateParam(nodeId, 'lumRange', [p.lumRange[0], v])}
          />
        </div>
      </div>

      {/* 边缘柔和 */}
      <ParamSlider
        label="边缘柔和"
        value={p.softness}
        min={0}
        max={50}
        step={1}
        onChange={(v) => updateParam(nodeId, 'softness', v)}
      />

      {/* 反选开关 */}
      <button
        onClick={() => updateParam(nodeId, 'invert', !p.invert)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded bg-studio-surface border border-studio-border hover:border-studio-accent/30 transition-all"
      >
        {p.invert ? (
          <ToggleRight size={18} className="text-studio-accent" />
        ) : (
          <ToggleLeft size={18} className="text-studio-text-dim" />
        )}
        <span className={`text-xs ${p.invert ? 'text-studio-accent' : 'text-studio-text-dim'}`}>
          反选模式
        </span>
      </button>
    </div>
  );
}
