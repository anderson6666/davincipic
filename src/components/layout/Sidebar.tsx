import { useState } from 'react';
import {
  Maximize2,
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

interface SidebarProps {
  mobile?: boolean;
}

export default function Sidebar({ mobile }: SidebarProps) {
  const [zoom, setZoom] = useState(100);
  const [compareMode, setCompareMode] = useState<CompareModeType>('result');
  const { fileName } = useImageStore();

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleFitToWindow = () => setZoom(100);

  return (
    <aside className={`${mobile ? 'w-full' : 'w-[380px]'} bg-studio-panel ${mobile ? '' : 'border-r'} border-studio-border flex flex-col overflow-hidden`}>
      {/* 图片预览区域 — 移动端占满空间 */}
      <div className={`flex-1 overflow-auto ${mobile ? 'p-2' : 'p-4'}`}>
        <ImagePreview zoom={zoom} compareMode={compareMode} />
      </div>

      {/* 文件名显示 */}
      {fileName && !mobile && (
        <div className="px-4 py-2 border-t border-studio-border">
          <p className="text-xs text-studio-text-dim truncate font-mono" title={fileName}>
            {fileName}
          </p>
        </div>
      )}

      {/* ===== 移动端：紧凑工具栏 ===== */}
      {mobile && (
        <div className="shrink-0 border-t border-studio-border px-2 py-2 space-y-2">
          {/* 缩放 + 对比模式一行 */}
          <div className="flex items-center gap-2">
            <button onClick={handleZoomOut} className="w-9 h-9 flex items-center justify-center rounded-lg bg-studio-surface border border-studio-border" title="缩小">
              <ZoomOut size={15} />
            </button>
            <span className="text-[11px] text-studio-text-dim min-w-[42px] text-center font-mono">{zoom}%</span>
            <button onClick={handleZoomIn} className="w-9 h-9 flex items-center justify-center rounded-lg bg-studio-surface border border-studio-border" title="放大">
              <ZoomIn size={15} />
            </button>
            <button onClick={handleFitToWindow} className="w-9 h-9 flex items-center justify-center rounded-lg bg-studio-surface border border-studio-border" title="适应">
              <Maximize2 size={14} />
            </button>
            <div className="flex-1" />
            {/* 对比模式切换（紧凑） */}
            <button onClick={() => setCompareMode('original')} className={`px-2.5 py-1.5 text-[10px] rounded-md border transition-all ${compareMode === 'original' ? 'bg-studio-accent/10 border-studio-accent text-studio-accent' : 'bg-studio-surface border-studio-border'}`}>
              原图
            </button>
            <button onClick={() => setCompareMode('result')} className={`px-2.5 py-1.5 text-[10px] rounded-md border transition-all ${compareMode === 'result' ? 'bg-studio-accent/10 border-studio-accent text-studio-accent' : 'bg-studio-surface border-studio-border'}`}>
              效果
            </button>
          </div>
        </div>
      )}

      {/* ===== 桌面端：完整控制栏 ===== */}
      {!mobile && (
        <>
          {/* 缩放控制栏 */}
          <div className="px-4 py-3 border-t border-studio-border">
            <div className="flex items-center justify-between gap-2">
              <button onClick={handleFitToWindow} className="px-3 py-1.5 text-xs rounded bg-studio-surface border border-studio-border hover:border-studio-accent hover:text-studio-accent transition-all" title="适应窗口">
                <Maximize2 size={14} className="inline mr-1" />适应
              </button>
              <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center rounded bg-studio-surface border border-studio-border hover:border-studio-accent transition-all" title="缩小">
                <ZoomOut size={16} />
              </button>
              <span className="text-xs text-studio-text-dim min-w-[50px] text-center font-mono">{zoom}%</span>
              <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center rounded bg-studio-surface border border-studio-border hover:border-studio-accent transition-all" title="放大">
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* 对比模式切换 */}
          <div className="px-4 py-3 border-t border-studio-border">
            <p className="text-xs text-studio-text-muted mb-2 font-mono uppercase tracking-wider">对比模式</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setCompareMode('original')} className={`px-3 py-2 text-xs rounded border transition-all ${compareMode === 'original' ? 'bg-studio-accent/10 border-studio-accent text-studio-accent' : 'bg-studio-surface border-studio-border hover:border-studio-accent/50'}`}>
                <Image size={14} className="inline mr-1" />原图
              </button>
              <button onClick={() => setCompareMode('result')} className={`px-3 py-2 text-xs rounded border transition-all ${compareMode === 'result' ? 'bg-studio-accent/10 border-studio-accent text-studio-accent' : 'bg-studio-surface border-studio-border hover:border-studio-accent/50'}`}>
                <Columns size={14} className="inline mr-1" />效果
              </button>
              <button onClick={() => setCompareMode('split')} className={`px-3 py-2 text-xs rounded border transition-all ${compareMode === 'split' ? 'bg-studio-accent/10 border-studio-accent text-studio-accent' : 'bg-studio-surface border-studio-border hover:border-studio-accent/50'}`}>
                <Columns size={14} className="inline mr-1" />分屏
              </button>
            </div>
          </div>

          {/* 直方图显示区域 */}
          <div className="px-4 py-3 border-t border-studio-border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-studio-text-dim" />
              <p className="text-xs text-studio-text-muted font-mono uppercase tracking-wider">直方图</p>
            </div>
            <Histogram />
          </div>
        </>
      )}
    </aside>
  );
}
