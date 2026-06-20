import { useRef } from 'react';
import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';
import { Upload, ImagePlus } from 'lucide-react';

interface Props {
  nodeId: string;
}

export default function ColorMatchParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!node) return null;
  const p = node.params as {
    referenceImage: string | null;
    matchStrength: number;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 创建临时 URL 用于预览（实际项目中应上传到服务器）
      const url = URL.createObjectURL(file);
      updateParam(nodeId, 'referenceImage', url);
    }
  };

  return (
    <div className="space-y-4">
      {/* 参考图 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">参考图像</p>

        {p.referenceImage ? (
          <div className="relative rounded-lg overflow-hidden border border-studio-border bg-studio-surface">
            <img
              src={p.referenceImage}
              alt="参考图"
              className="w-full h-32 object-cover"
            />
            <button
              onClick={() => updateParam(nodeId, 'referenceImage', null)}
              className="absolute top-1.5 right-1.5 px-2 py-1 text-[10px] bg-black/70 text-white rounded hover:bg-red-600 transition-colors"
            >
              移除
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 px-3 py-6 text-xs text-studio-text-dim bg-studio-surface border border-dashed border-studio-border rounded hover:border-studio-accent/50 hover:text-studio-accent transition-all"
            >
              <Upload size={20} />
              <span>点击上传参考图像</span>
              <span className="text-[10px] text-studio-text-muted">支持 JPG / PNG / WebP</span>
            </button>
          </>
        )}
      </div>

      {/* 匹配强度 */}
      <ParamSlider
        label="匹配强度"
        value={p.matchStrength * 100}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => updateParam(nodeId, 'matchStrength', v / 100)}
      />

      {/* 提示信息 */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-studio-surface rounded text-[11px] text-studio-text-muted">
        <ImagePlus size={14} className="shrink-0 mt-0.5" />
        <span>上传一张目标风格的参考图，系统将自动匹配色彩特征。</span>
      </div>
    </div>
  );
}
