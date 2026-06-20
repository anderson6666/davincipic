import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';

interface Props {
  nodeId: string;
}

export default function SecondaryParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));

  if (!node) return null;
  const p = node.params as {
    hueShift: number;
    satAdjust: number;
    lumAdjust: number;
  };

  return (
    <div className="space-y-1">
      <ParamSlider
        label="色相偏移"
        value={p.hueShift}
        min={-180}
        max={180}
        step={1}
        unit="°"
        onChange={(v) => updateParam(nodeId, 'hueShift', v)}
      />
      <ParamSlider
        label="饱和度调整"
        value={p.satAdjust}
        min={-50}
        max={50}
        step={1}
        unit="%"
        onChange={(v) => updateParam(nodeId, 'satAdjust', v)}
      />
      <ParamSlider
        label="亮度调整"
        value={p.lumAdjust}
        min={-50}
        max={50}
        step={1}
        onChange={(v) => updateParam(nodeId, 'lumAdjust', v)}
      />
    </div>
  );
}
