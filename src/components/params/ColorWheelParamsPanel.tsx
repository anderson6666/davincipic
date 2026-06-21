import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';

interface Props {
  nodeId: string;
}

interface WheelGroupProps {
  title: string;
  hue: number;
  sat: number;
  master: number;
  onHueChange: (v: number) => void;
  onSatChange: (v: number) => void;
  onMasterChange: (v: number) => void;
}

function WheelGroup({ title, hue, sat, master, onHueChange, onSatChange, onMasterChange }: WheelGroupProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-studio-text-dim uppercase tracking-wider">{title}</span>
      </div>

      {/* 色相条 */}
      <div className="relative h-2 rounded-full mb-3 overflow-hidden" style={{
        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
      }}>
        <div
          className="absolute top-0 w-0.5 h-full bg-white shadow-glow-sm"
          style={{ left: `${(hue / 360) * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="space-y-1 pl-1">
        <ParamSlider
          label="色相"
          value={hue}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={onHueChange}
        />
        <ParamSlider
          label="饱和度"
          value={sat}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={onSatChange}
        />
        <ParamSlider
          label="亮度"
          value={master}
          min={-1}
          max={1}
          step={0.01}
          onChange={onMasterChange}
        />
      </div>
    </div>
  );
}

export default function ColorWheelParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));

  if (!node) return null;
  const p = node.params as {
    lift: { h: number; s: number };
    gamma: { h: number; s: number };
    gain: { h: number; s: number };
    liftMaster: number;
    gammaMaster: number;
    gainMaster: number;
  };

  return (
    <div className="space-y-1">
      <WheelGroup
        title="Lift"
        hue={p.lift.h}
        sat={p.lift.s}
        master={p.liftMaster}
        onHueChange={(v) => updateParam(nodeId, 'lift', { ...p.lift, h: v })}
        onSatChange={(v) => updateParam(nodeId, 'lift', { ...p.lift, s: v })}
        onMasterChange={(v) => updateParam(nodeId, 'liftMaster', v)}
      />
      <WheelGroup
        title="Gamma"
        hue={p.gamma.h}
        sat={p.gamma.s}
        master={p.gammaMaster}
        onHueChange={(v) => updateParam(nodeId, 'gamma', { ...p.gamma, h: v })}
        onSatChange={(v) => updateParam(nodeId, 'gamma', { ...p.gamma, s: v })}
        onMasterChange={(v) => updateParam(nodeId, 'gammaMaster', v)}
      />
      <WheelGroup
        title="Gain"
        hue={p.gain.h}
        sat={p.gain.s}
        master={p.gainMaster}
        onHueChange={(v) => updateParam(nodeId, 'gain', { ...p.gain, h: v })}
        onSatChange={(v) => updateParam(nodeId, 'gain', { ...p.gain, s: v })}
        onMasterChange={(v) => updateParam(nodeId, 'gainMaster', v)}
      />
    </div>
  );
}
