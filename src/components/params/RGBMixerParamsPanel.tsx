import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';

interface Props {
  nodeId: string;
}

interface ChannelRowProps {
  channelLabel: string;
  channelColor: string;
  r: number;
  g: number;
  b: number;
  onRChange: (v: number) => void;
  onGChange: (v: number) => void;
  onBChange: (v: number) => void;
}

function ChannelRow({ channelLabel, channelColor, r, g, b, onRChange, onGChange, onBChange }: ChannelRowProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: channelColor }} />
        <span className="text-xs font-mono text-studio-text-dim">{channelLabel} 输出</span>
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 pl-1">
        <ParamSlider
          label="R"
          value={r}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={onRChange}
        />
        <ParamSlider
          label="G"
          value={g}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={onGChange}
        />
        <ParamSlider
          label="B"
          value={b}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={onBChange}
        />
      </div>
    </div>
  );
}

export default function RGBMixerParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));

  if (!node) return null;
  const p = node.params as {
    redOut: { r: number; g: number; b: number };
    greenOut: { r: number; g: number; b: number };
    blueOut: { r: number; g: number; b: number };
  };

  return (
    <div>
      <ChannelRow
        channelLabel="Red"
        channelColor="#ef4444"
        r={p.redOut.r}
        g={p.redOut.g}
        b={p.redOut.b}
        onRChange={(v) => updateParam(nodeId, 'redOut', { ...p.redOut, r: v })}
        onGChange={(v) => updateParam(nodeId, 'redOut', { ...p.redOut, g: v })}
        onBChange={(v) => updateParam(nodeId, 'redOut', { ...p.redOut, b: v })}
      />
      <ChannelRow
        channelLabel="Green"
        channelColor="#22c55e"
        r={p.greenOut.r}
        g={p.greenOut.g}
        b={p.greenOut.b}
        onRChange={(v) => updateParam(nodeId, 'greenOut', { ...p.greenOut, r: v })}
        onGChange={(v) => updateParam(nodeId, 'greenOut', { ...p.greenOut, g: v })}
        onBChange={(v) => updateParam(nodeId, 'greenOut', { ...p.greenOut, b: v })}
      />
      <ChannelRow
        channelLabel="Blue"
        channelColor="#3b82f6"
        r={p.blueOut.r}
        g={p.blueOut.g}
        b={p.blueOut.b}
        onRChange={(v) => updateParam(nodeId, 'blueOut', { ...p.blueOut, r: v })}
        onGChange={(v) => updateParam(nodeId, 'blueOut', { ...p.blueOut, g: v })}
        onBChange={(v) => updateParam(nodeId, 'blueOut', { ...p.blueOut, b: v })}
      />
    </div>
  );
}
