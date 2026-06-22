import { useState, useCallback, useRef } from 'react';
import { Sparkles, Upload, ImagePlus, ShieldCheck, Loader2, Download } from 'lucide-react';
import { useImageStore } from '../../store/useImageStore';
import ProgressBar from '../ui/ProgressBar';

interface MainPanelProps {
  onUpload: () => void;
  onFileDrop?: (file: File) => void;
  onStartReview?: () => void;
  mobile?: boolean;
}

/** AI 分析结果面板 */
function AIPanel({ onStartReview }: { onStartReview?: () => void }) {
  const analysisResult = useImageStore((s) => s.analysisResult);
  const isLoading = useImageStore((s) => s.isLoading);
  const uploadProgress = useImageStore((s) => s.uploadProgress);
  const analysisProgress = useImageStore((s) => s.analysisProgress);
  const currentStage = useImageStore((s) => s.currentStage);
  /* 复查状态 */
  const v1Result = useImageStore((s) => s.v1Result);
  const v1ResultImage = useImageStore((s) => s.v1ResultImage);
  const isReviewing = useImageStore((s) => s.isReviewing);
  const reviewProgress = useImageStore((s) => s.reviewProgress);
  const reviewStage = useImageStore((s) => s.reviewStage);
  const v2Result = useImageStore((s) => s.v2Result);
  const v2ResultImage = useImageStore((s) => s.v2ResultImage);

  /** 下载base64图片 */
  const downloadImage = (dataUrl: string, name: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    a.click();
  };

  if (isLoading) {
    const isUploading = uploadProgress < 100;
    const activeProgress = isUploading ? uploadProgress : analysisProgress;

    return (
      <div className="bg-gradient-to-br from-studio-surface to-studio-panel rounded-2xl border border-studio-border p-6 space-y-5 shadow-card top-highlight">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUploading ? 'bg-studio-accent/10' : 'bg-studio-warning/10'}`}>
            <Sparkles size={16} className={`animate-pulse ${isUploading ? 'text-studio-accent' : 'text-studio-warning'}`} />
          </div>
          <h3 className="text-sm font-mono text-studio-text font-medium">
            {isUploading ? '正在加载图片' : 'Agnes AI 分析中'}
          </h3>
        </div>

        {/* 上传进度条 */}
        {uploadProgress < 100 && (
          <ProgressBar
            progress={uploadProgress}
            label={currentStage || '正在读取图片...'}
            color="bg-studio-accent"
            size="sm"
          />
        )}

        {/* AI 分析进度条 */}
        {!isUploading && (
          <ProgressBar
            progress={analysisProgress}
            label={currentStage || '正在分析...'}
            color="bg-studio-warning"
            size="md"
          />
        )}
      </div>
    );
  }

  if (!analysisResult) {
    return null; // 空状态由 UploadZone 渲染
  }

  return (
    <div className="bg-gradient-to-br from-studio-surface to-studio-panel rounded-2xl border border-studio-border p-6 shadow-card top-highlight">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-studio-warning/10 flex items-center justify-center">
          <Sparkles size={16} className="text-studio-warning" />
        </div>
        <h3 className="text-sm font-mono text-studio-text font-medium">Agnes AI 分析结果</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-studio-border to-transparent" />
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-studio-bg/60 rounded-lg px-3 py-3 text-center border border-studio-border/50">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider mb-1">场景</p>
          <p className="text-xs text-studio-text font-medium">{analysisResult.sceneType}</p>
        </div>
        <div className="bg-studio-bg/60 rounded-lg px-3 py-3 text-center border border-studio-border/50">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider mb-1">亮度</p>
          <p className="text-xs text-studio-text font-medium">{analysisResult.brightness}</p>
        </div>
        <div className="bg-studio-bg/60 rounded-lg px-3 py-3 text-center border border-studio-border/50">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider mb-1">对比度</p>
          <p className="text-xs text-studio-text font-medium">{analysisResult.contrastLevel}</p>
        </div>
      </div>

      {/* 主要颜色 */}
      {analysisResult.dominantColors.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-studio-text-muted/50" />
            主要颜色
          </p>
          <div className="flex gap-2">
            {analysisResult.dominantColors.map((color, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg border border-studio-border shadow-sm hover:scale-110 hover:shadow-glow-sm transition-all cursor-default"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* 调色建议 */}
      {analysisResult.suggestions.length > 0 && (
        <div>
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-studio-text-muted/50" />
            AI 调色建议
          </p>
          <ul className="space-y-2">
            {analysisResult.suggestions.map((suggestion, i) => (
              <li key={i} className="text-xs text-studio-text-dim flex items-start gap-2 bg-studio-bg/40 rounded-lg px-3 py-2 border border-studio-border/40">
                <span className="text-studio-accent mt-0.5 shrink-0">&rarr;</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== 复查区域 ===== */}
      <div className="mt-5 space-y-3">
        {/* V1效果图预览 */}
        {v1ResultImage && !v2Result && (
          <div className="rounded-lg overflow-hidden border border-studio-border">
            <img src={v1ResultImage} alt="V1调色效果" className="w-full h-auto" />
            <div className="px-3 py-2 bg-studio-bg flex items-center justify-between">
              <span className="text-[10px] font-mono text-studio-text-dim">V1 调色效果</span>
              <button onClick={() => downloadImage(v1ResultImage, 'v1_graded.jpg')}
                className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Download size={11} /> 下载
              </button>
            </div>
          </div>
        )}

        {/* 复查按钮 */}
        {!isReviewing && v1Result && !v2Result && onStartReview && (
          <button onClick={onStartReview}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-mono font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
          >
            <ShieldCheck size={14} /> 开始复查 — AI二次精炼
          </button>
        )}

        {/* 复查进度 */}
        {isReviewing && (
          <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="text-violet-400 animate-spin" />
              <span className="text-xs font-mono text-violet-300">首席调色师复查中...</span>
            </div>
            <ProgressBar progress={reviewProgress} label={reviewStage || '复查中...'} color="bg-violet-500" size="md" />
          </div>
        )}

        {/* 复查完成：V2结果 */}
        {v2Result && (
          <div className="rounded-xl bg-gradient-to-r from-violet-500/8 to-fuchsia-500/8 border border-violet-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-violet-400" />
              <h4 className="text-xs font-mono text-violet-300 font-semibold">第二版成品 (V2)</h4>
            </div>

            {/* V2效果图 */}
            {v2ResultImage && (
              <div className="rounded-lg overflow-hidden border border-violet-500/20">
                <img src={v2ResultImage} alt="V2精炼效果" className="w-full h-auto" />
                <div className="px-3 py-2 bg-studio-bg flex items-center justify-between">
                  <span className="text-[10px] font-mono text-violet-400/70">V2 精炼成品</span>
                  <button onClick={() => downloadImage(v2ResultImage, 'v2_refined.jpg')}
                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Download size={11} /> 下载V2
                  </button>
                </div>
              </div>
            )}

            {/* 审查意见 */}
            {v2Result.review && (
              <div className="bg-studio-bg rounded-lg p-3">
                <p className="text-[10px] font-mono text-studio-text-muted mb-1.5">审查意见</p>
                <p className="text-xs text-studio-text-dim leading-relaxed">{v2Result.review.verdict}</p>
              </div>
            )}

            {/* V2调色建议 */}
            {v2Result.v2Suggestions && v2Result.v2Suggestions.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-studio-text-muted mb-1.5">V2 精炼建议</p>
                <ul className="space-y-1">
                  {v2Result.v2Suggestions.map((s, i) => (
                    <li key={i} className="text-[11px] text-studio-text-dim flex items-start gap-1.5">
                      <span className="text-violet-400 mt-0.5 shrink-0">&#x2022;</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 上传区域 - 可点击 + 拖拽 */
function UploadZone({ onUpload, onFileDrop, mobile }: { onUpload: () => void; onFileDrop?: (file: File) => void; mobile?: boolean }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragRef = useRef<number>(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current--;
    if (dragRef.current <= 0) {
      dragRef.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragRef.current = 0;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      // 拖拽时直接传文件给回调
      onFileDrop?.(files[0]);
    }
  }, [onFileDrop]);

  return (
    <div
      onClick={onUpload}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden
        ${mobile ? 'min-h-[260px] py-8' : 'min-h-[400px] py-12'}
        ${isDragOver
          ? 'border-studio-accent bg-studio-accent/[0.06] scale-[1.01] shadow-glow-accent'
          : 'border-studio-border-light hover:border-studio-accent/60 hover:bg-studio-surface/40 hover:shadow-card'
        }`}
    >
      {/* 装饰性背景光晕 */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
        isDragOver ? 'opacity-100' : ''
      }`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-studio-accent/8 blur-3xl" />
      </div>

      <div className={`relative transition-transform duration-300 ${isDragOver ? 'scale-110' : 'group-hover:scale-105'}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
          isDragOver
            ? 'bg-gradient-to-br from-studio-accent/25 to-cyan-600/25 shadow-glow-accent'
            : 'bg-gradient-to-br from-studio-surface to-studio-panel border border-studio-border group-hover:border-studio-accent/40'
        }`}>
          {isDragOver ? (
            <ImagePlus size={mobile ? 26 : 30} className="text-studio-accent animate-pulse" />
          ) : (
            <Upload size={mobile ? 24 : 28} className="text-studio-text-muted group-hover:text-studio-accent transition-colors" />
          )}
        </div>
      </div>

      <p className={`relative ${mobile ? 'text-sm' : 'text-base'} text-studio-text mb-1.5 font-medium`}>
        {isDragOver ? '释放以上传图片' : '点击或拖拽图片到此处'}
      </p>
      <p className="relative text-xs text-studio-text-muted">
        AI 将自动分析并完成调色
      </p>

      {/* 装饰性标签 */}
      {!mobile && (
        <div className="relative flex items-center gap-2 mt-6 opacity-60">
          {['智能分析', '自动调色', '一键导出'].map((tag) => (
            <span key={tag} className="px-2.5 py-1 text-[10px] rounded-full bg-studio-surface/60 text-studio-text-muted border border-studio-border font-mono">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** 中央主面板 */
export default function MainPanel({ onUpload, onFileDrop, onStartReview, mobile }: MainPanelProps) {
  const analysisResult = useImageStore((s) => s.analysisResult);
  const isLoading = useImageStore((s) => s.isLoading);

  return (
    <main className={`flex-1 bg-studio-bg overflow-auto ${mobile ? 'p-3' : 'p-6'}`}>
      <div className={mobile ? 'space-y-4' : 'max-w-2xl mx-auto space-y-6'}>
        {isLoading ? (
          <AIPanel onStartReview={onStartReview} />
        ) : analysisResult ? (
          <AIPanel onStartReview={onStartReview} />
        ) : (
          <UploadZone onUpload={onUpload} onFileDrop={onFileDrop} mobile={mobile} />
        )}
      </div>
    </main>
  );
}
