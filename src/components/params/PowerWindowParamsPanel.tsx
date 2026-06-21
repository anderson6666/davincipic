import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';

interface Props {
  nodeId: string;
}

const SHAPES = ['circle', 'linear'] as const;

export default function PowerWindowParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));

  if (!node) return null;
  const p = node.params as {
    shape: 'circle' | 'linear';
    centerX: number;
    centerY: number;
    size: number;
    angle: number;
    feather: number;
  };

  return (
    <div className="space-y-4">
      {/* 形状选择 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">形状</p>
        <div className="flex gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => updateParam(nodeId, 'shape', shape)}
              className={`flex-1 py-2 text-xs rounded border transition-all ${
                p.shape === shape
                  ? 'bg-studio-accent/15 border-studio-accent/50 text-studio-accent'
                  : 'bg-studio-surface border-studio-border text-studio-text-dim hover:border-studio-border-light'
              }`}
            >
              {shape === 'circle' ? '圆形' : '线性'}
            </button>
          ))}
        </div>
      </div>

      {/* 中心位置 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">中心位置</p>
        <div className="space-y-1 pl-1">
          <ParamSlider
            label="X"
            value={p.centerX}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'centerX', v)}
          />
          <ParamSlider
            label="Y"
            value={p.centerY}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => updateParam(nodeId, 'centerY', v)}
          />
        </div>
      </div>

      {/* 大小 */}
      <ParamSlider
        label="大小"
        value={p.size}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => updateParam(nodeId, 'size', v)}
      />

      {/* 角度 (仅线性形状显示) */}
      {p.shape === 'linear' && (
        <ParamSlider
          label="角度"
          value={p.angle}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(v) => updateParam(nodeId, 'angle', v)}
        />
      )}

      {/* 羽化 */}
      <ParamSlider
        label="羽化"
        value={p.feather}
        min={0}
        max={50}
        step={1}
        unit="%"
        onChange={(v) => updateParam(nodeId, 'feather', v)}
      />
    </div>
  );
}
