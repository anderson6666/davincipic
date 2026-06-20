import { useRef, useEffect, useMemo } from 'react';
import { useImageStore } from '@/store/useImageStore';

/** 直方图通道配置 */
const CHANNELS = [
  { key: 'r' as const, color: '#ef4444', label: 'R' },
  { key: 'g' as const, color: '#22c55e', label: 'G' },
  { key: 'b' as const, color: '#3b82f6', label: 'B' },
];

export default function Histogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentImageData } = useImageStore();

  // 计算直方图数据（带 memo 避免重复计算）
  const histogramData = useMemo(() => {
    const data = {
      r: new Float32Array(256),
      g: new Float32Array(256),
      b: new Float32Array(256),
    };

    if (!currentImageData) return { ...data, maxCount: 0 };

    const pixels = currentImageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      data.r[pixels[i]]++;
      data.g[pixels[i + 1]]++;
      data.b[pixels[i + 2]]++;
    }

    // 归一化
    let maxCount = 0;
    for (let i = 0; i < 256; i++) {
      maxCount = Math.max(maxCount, data.r[i], data.g[i], data.b[i]);
    }
    if (maxCount > 0) {
      const invMax = 1 / maxCount;
      for (let i = 0; i < 256; i++) {
        data.r[i] *= invMax;
        data.g[i] *= invMax;
        data.b[i] *= invMax;
      }
    }

    return { ...data, maxCount };
  }, [currentImageData]);

  // 绘制直方图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = 96;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 清空
    ctx.clearRect(0, 0, width, height);

    // 背景
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    if (currentImageData && histogramData.maxCount > 0) {
      const padding = 2;
      const drawWidth = width - padding * 2;
      const drawHeight = height - padding * 6; // 底部留空间给图例

      // 绘制半透明填充区域（从下往上）
      for (const ch of CHANNELS) {
        ctx.beginPath();
        ctx.moveTo(padding, height - padding * 3);
        for (let x = 0; x < 256; x++) {
          const barH = histogramData[ch.key][x] * drawHeight;
          ctx.lineTo(padding + (x / 255) * drawWidth, height - padding * 3 - barH);
        }
        ctx.lineTo(width - padding, height - padding * 3);
        ctx.closePath();
        ctx.fillStyle = ch.color.replace(')', ', 0.12)').replace('rgb', 'rgba');
        ctx.fill();
      }

      // 绘制线条（上层，更清晰）
      for (const ch of CHANNELS) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = ch.color;
        for (let x = 0; x < 256; x++) {
          const barH = histogramData[ch.key][x] * drawHeight;
          const px = padding + (x / 255) * drawWidth;
          const py = height - padding * 3 - barH;
          if (x === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // 参考线：阴影/中间调/高光分界
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      [0.25, 0.5, 0.75].forEach((pos) => {
        const x = padding + pos * drawWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - padding * 3);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    } else {
      // 空状态
      ctx.fillStyle = '#333';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('等待图片加载...', width / 2, height / 2);
    }

    // 底部边框线
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 4);
    ctx.lineTo(width, height - 4);
    ctx.stroke();

  }, [currentImageData, histogramData]);

  return (
    <div className="w-full rounded overflow-hidden bg-studio-bg">
      <div className="relative" style={{ height: '96px' }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      </div>
      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 py-1.5 border-t border-studio-border/50">
        {CHANNELS.map((ch) => (
          <div key={ch.key} className="flex items-center gap-1">
            <div
              className="w-2.5 h-[3px] rounded-sm"
              style={{ backgroundColor: ch.color }}
            />
            <span className="text-[10px] text-studio-text-dim font-mono">{ch.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
