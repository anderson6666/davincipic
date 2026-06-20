import { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Columns,
  Image,
  BarChart3,
} from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import ImagePreview from '@/components/preview/ImagePreview';
import Histogram from '@/components/preview/Histogram';

type CompareModeType = 'original' | 'result' | 'split';

export default function Sidebar() {
  const [zoom, setZoom] = useState(100);
  const [compareMode, setCompareMode] = useState<CompareModeType>('result');
  const { fileName } = useImageStore();

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleFitToWindow = () => setZoom(100);
  const handleOneToOne = () => setZoom(100);

  return (
    <aside className="w-[380px] bg-studio-panel border-r border-studio-border flex flex-col overflow-hidden">
      {/* 图片预览区域 */}
      <div className="flex-1 overflow-auto p-4">
        <ImagePreview zoom={zoom} compareMode={compareMode} />
      </div>

      {/* 文件名显示 */}
      {fileName && (
        <div className="px-4 py-2 border-t border-studio-border">
          <p className="text-xs text-studio-text-dim truncate font-mono" title={fileName}>
            📄 {fileName}
          </p>
        </div>
      )}

      {/* 缩放控制栏 */}
      <div className="px-4 py-3 border-t border-studio-border">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleFitToWindow}
            className="px-3 py-1.5 text-xs rounded bg-studio-surface border border-studio-border hover:border-studio-accent hover:text-studio-accent transition-all"
            title="适应窗口"
          >
            <Maximize2 size={14} className="inline mr-1" />
            适应
          </button>
          <button
            onClick={handleOneToOne}
            className="px-3 py-1.5 text-xs rounded bg-studio-surface border border-studio-border hover:border-studio-accent hover:text-studio-accent transition-all"
            title="1:1 原始尺寸"
          >
            1:1
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center rounded bg-studio-surface border border-studio-border hover:border-studio-accent transition-all"
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-studio-text-dim min-w-[50px] text-center font-mono">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center rounded bg-studio-surface border border-studio-border hover:border-studio-accent transition-all"
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* 对比模式切换 */}
      <div className="px-4 py-3 border-t border-studio-border">
        <p className="text-xs text-studio-text-muted mb-2 font-mono uppercase tracking-wider">
          对比模式
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setCompareMode('original')}
            className={`px-3 py-2 text-xs rounded border transition-all ${
              compareMode === 'original'
                ? 'bg-studio-accent/10 border-studio-accent text-studio-accent'
                : 'bg-studio-surface border-studio-border hover:border-studio-accent/50'
            }`}
          >
            <Image size={14} className="inline mr-1" />
            原图
          </button>
          <button
            onClick={() => setCompareMode('result')}
            className={`px-3 py-2 text-xs rounded border transition-all ${
              compareMode === 'result'
                ? 'bg-studio-accent/10 border-studio-accent text-studio-accent'
                : 'bg-studio-surface border-studio-border hover:border-studio-accent/50'
            }`}
          >
            <Columns size={14} className="inline mr-1" />
            效果
          </button>
          <button
            onClick={() => setCompareMode('split')}
            className={`px-3 py-2 text-xs rounded border transition-all ${
              compareMode === 'split'
                ? 'bg-studio-accent/10 border-studio-accent text-studio-accent'
                : 'bg-studio-surface border-studio-border hover:border-studio-accent/50'
            }`}
          >
            <Columns size={14} className="inline mr-1" />
            分屏
          </button>
        </div>
      </div>

      {/* 直方图显示区域 */}
      <div className="px-4 py-3 border-t border-studio-border">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={14} className="text-studio-text-dim" />
          <p className="text-xs text-studio-text-muted font-mono uppercase tracking-wider">
            直方图
          </p>
        </div>
        <Histogram />
      </div>
    </aside>
  );
}
