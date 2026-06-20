import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';

interface Props {
  nodeId: string;
}

const sliders = [
  { key: 'exposure', label: '曝光', min: -2, max: 2, step: 0.01 },
  { key: 'contrast', label: '对比度', min: -1, max: 1, step: 0.01 },
  { key: 'highlights', label: '高光', min: -1, max: 1, step: 0.01 },
  { key: 'shadows', label: '阴影', min: -1, max: 1, step: 0.01 },
  { key: 'whites', label: '白色', min: -1, max: 1, step: 0.01 },
  { key: 'blacks', label: '黑色', min: -1, max: 1, step: 0.01 },
  { key: 'saturation', label: '饱和度', min: -1, max: 1, step: 0.01 },
] as const;

export default function PrimaryParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) =>
    s.nodes.find((n) => n.id === nodeId)
  );

  if (!node) return null;
  const params = node.params;

  return (
    <div className="space-y-1">
      {sliders.map(({ key, label, min, max, step }) => (
        <ParamSlider
          key={key}
          label={label}
          value={params[key] as number}
          min={min}
          max={max}
          step={step}
          onChange={(value) => updateParam(nodeId, key, value)}
        />
      ))}
    </div>
  );
}
