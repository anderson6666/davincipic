import { useState, useCallback, useRef, useEffect } from 'react';
import { useNodeStore } from '../../store/useNodeStore';
import { RotateCcw } from 'lucide-react';
import type { CurvePoint } from '../../types';

interface Props {
  nodeId: string;
}

type Channel = 'master' | 'red' | 'green' | 'blue';

const CHANNEL_CONFIG: Record<Channel, { label: string; color: string }> = {
  master: { label: 'Master', color: '#e5e5e5' },
  red: { label: 'R', color: '#ef4444' },
  green: { label: 'G', color: '#22c55e' },
  blue: { label: 'B', color: '#3b82f6' },
};

// 预设曲线
interface Preset {
  name: string;
  generator: () => CurvePoint[];
}

const PRESETS: Preset[] = [
  {
    name: '线性',
    generator: () => [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  },
  {
    name: 'S形',
    generator: () => {
      const pts: CurvePoint[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const y = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        pts.push({ x: t, y });
      }
      return pts;
    },
  },
  {
    name: '提亮',
    generator: () => {
      const pts: CurvePoint[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        pts.push({ x: t, y: Math.min(1, t + 0.12 * Math.sin(t * Math.PI)) });
      }
      return pts;
    },
  },
  {
    name: '压暗',
    generator: () => {
      const pts: CurvePoint[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        pts.push({ x: t, y: Math.max(0, t - 0.15 * Math.sin(t * Math.PI)) });
      }
      return pts;
    },
  },
  {
    name: '胶片',
    generator: () => {
      const pts: CurvePoint[] = [{ x: 0, y: 0 }];
      for (let i = 1; i <= 9; i++) {
        const t = i / 10;
        const y =
          t < 0.3
            ? t * 0.85
            : t > 0.7
              ? 0.85 + (t - 0.7) * 0.5
              : 0.255 + (t - 0.3) * 1.35;
        pts.push({ x: t, y: Math.max(0, Math.min(1, y)) });
      }
      pts.push({ x: 1, y: 1 });
      return pts;
    },
  },
  {
    name: '对比',
    generator: () => {
      const pts: CurvePoint[] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const y = ((t - 0.5) * 1.4 + 0.5);
        pts.push({ x: t, y: Math.max(0, Math.min(1, y)) });
      }
      return pts;
    },
  },
];

export default function CurveParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeChannel, setActiveChannel] = useState<Channel>('master');
  const [isDragging, setIsDragging] = useState(false);

  if (!node) return null;

  const params = node.params as Record<string, CurvePoint[]>;
  const currentCurve = params[activeChannel] || [];

  // 绘制曲线
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 24;

    // 清空
    ctx.clearRect(0, 0, w, h);

    // 网格
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const pos = pad + (i / 4) * (w - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pos, pad);
      ctx.lineTo(pos, h - pad);
      ctx.stroke();

      const posY = h - pad - (i / 4) * (h - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, posY);
      ctx.lineTo(w - pad, posY);
      ctx.stroke();
    }

    // 对角线参考
    ctx.strokeStyle = '#333';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, pad);
    ctx.stroke();
    ctx.setLineDash([]);

    // 曲线
    if (currentCurve.length >= 2) {
      const cfg = CHANNEL_CONFIG[activeChannel];
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      currentCurve.forEach((pt, idx) => {
        const cx = pad + pt.x * (w - pad * 2);
        const cy = h - pad - pt.y * (h - pad * 2);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // 控制点
      currentCurve.forEach((pt) => {
        const cx = pad + pt.x * (w - pad * 2);
        const cy = h - pad - pt.y * (h - pad * 2);
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [currentCurve, activeChannel]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = canvas.width;
      const h = canvas.height;
      const pad = 24;
      const scaleX = w / rect.width;
      const scaleY = h / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      let x = (mx - pad) / (w - pad * 2);
      let y = 1 - (my - pad) / (h - pad * 2);
      x = Math.max(0, Math.min(1, x));
      y = Math.max(0, Math.min(1, y));

      const newPoints = [...currentCurve];
      newPoints.push({ x, y });
      newPoints.sort((a, b) => a.x - b.x);
      updateParam(nodeId, activeChannel, newPoints);
    },
    [currentCurve, nodeId, activeChannel, updateParam]
  );

  const handleReset = useCallback(() => {
    updateParam(nodeId, activeChannel, [{ x: 0, y: 0 }, { x: 1, y: 1 }]);
  }, [nodeId, activeChannel, updateParam]);

  const handlePreset = useCallback(
    (preset: Preset) => {
      updateParam(nodeId, activeChannel, preset.generator());
    },
    [nodeId, activeChannel, updateParam]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* 频道切换 */}
      <div className="flex gap-1">
        {(Object.keys(CHANNEL_CONFIG) as Channel[]).map((ch) => {
          const cfg = CHANNEL_CONFIG[ch];
          return (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-all ${
                activeChannel === ch
                  ? 'bg-studio-surface text-studio-text border border-studio-border'
                  : 'text-studio-text-muted hover:text-studio-text-dim'
              }`}
            >
              <span style={{ color: activeChannel === ch ? cfg.color : undefined }}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="relative bg-[#141414] rounded-lg border border-studio-border overflow-hidden">
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onClick={handleCanvasClick}
          className="w-full cursor-crosshair"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-studio-text-dim hover:text-studio-accent bg-studio-surface rounded border border-studio-border hover:border-studio-accent/30 transition-all"
        >
          <RotateCcw size={11} />
          重置
        </button>
      </div>

      {/* 预设 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-1.5 font-mono uppercase tracking-wider">预设曲线</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePreset(preset)}
              className="px-2.5 py-1 text-xs rounded bg-studio-surface border border-studio-border hover:border-studio-accent/40 hover:text-studio-accent transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-studio-text-muted text-center">
        点击画布添加控制点 · 当前 {currentCurve.length} 个点
      </p>
    </div>
  );
}
