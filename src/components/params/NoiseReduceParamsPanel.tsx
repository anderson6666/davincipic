import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';

interface Props {
  nodeId: string;
}

export default function NoiseReduceParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));

  if (!node) return null;
  const p = node.params as {
    spatialRadius: number;
    strength: number;
    protectDetail: number;
  };

  return (
    <div className="space-y-1">
      <ParamSlider
        label="空间半径"
        value={p.spatialRadius}
        min={1}
        max={10}
        step={1}
        unit=" px"
        onChange={(v) => updateParam(nodeId, 'spatialRadius', v)}
      />
      <ParamSlider
        label="强度"
        value={p.strength * 100}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => updateParam(nodeId, 'strength', v / 100)}
      />
      <ParamSlider
        label="细节保护"
        value={p.protectDetail * 100}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => updateParam(nodeId, 'protectDetail', v / 100)}
      />
    </div>
  );
}
