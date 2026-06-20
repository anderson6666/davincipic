import { useRef } from 'react';
import { useNodeStore } from '../../store/useNodeStore';
import ParamSlider from './ParamSlider';
import { Upload, FileImage } from 'lucide-react';

interface Props {
  nodeId: string;
}

const LUT_OPTIONS = [
  { value: '', label: '无' },
  { value: 'warm', label: '暖色调' },
  { value: 'cool', label: '冷色调' },
  { value: 'cinematic', label: '电影感' },
  { value: 'vintage', label: '复古' },
  { value: 'bw', label: '黑白' },
];

export default function LUTParamsPanel({ nodeId }: Props) {
  const updateParam = useNodeStore((s) => s.updateNodeParam);
  const node = useNodeStore((s) => s.nodes.find((n) => n.id === nodeId));
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!node) return null;
  const p = node.params as {
    lutName: string;
    intensity: number;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateParam(nodeId, 'lutName', `custom:${file.name}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* LUT 选择 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">LUT 预设</p>
        <select
          value={p.lutName}
          onChange={(e) => updateParam(nodeId, 'lutName', e.target.value)}
          className="w-full px-3 py-2 text-xs bg-studio-surface border border-studio-border rounded text-studio-text outline-none focus:border-studio-accent/50 transition-colors cursor-pointer"
        >
          {LUT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {p.lutName.startsWith('custom:') && (
            <option value={p.lutName}>{p.lutName.replace('custom:', '')}</option>
          )}
        </select>
      </div>

      {/* 强度 */}
      <ParamSlider
        label="强度"
        value={p.intensity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateParam(nodeId, 'intensity', v)}
      />

      {/* 自定义上传 */}
      <div>
        <p className="text-[10px] text-studio-text-muted mb-2 font-mono uppercase tracking-wider">自定义 LUT</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".cube,.3dl,.look"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-studio-text-dim bg-studio-surface border border-studio-border rounded hover:border-studio-accent/40 hover:text-studio-accent transition-all"
        >
          <Upload size={14} />
          上传 .cube / .3dl 文件
        </button>
        {p.lutName.startsWith('custom:') && (
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 bg-studio-surface rounded text-xs">
            <FileImage size={12} className="text-studio-accent" />
            <span className="text-studio-text-dim truncate">
              {p.lutName.replace('custom:', '')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
