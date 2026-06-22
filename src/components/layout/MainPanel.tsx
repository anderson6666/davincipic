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
      <div className="bg-studio-surface rounded-xl border border-studio-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className={`animate-pulse ${isUploading ? 'text-studio-text-dim' : 'text-studio-warning'}`} />
          <h3 className="text-sm font-mono text-studio-text">
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
    <div className="bg-studio-surface rounded-xl border border-studio-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-studio-warning" />
        <h3 className="text-sm font-mono text-studio-text">Agnes AI 分析结果</h3>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-studio-bg rounded-lg px-3 py-2.5 text-center">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider">场景</p>
          <p className="text-xs text-studio-text mt-1 font-medium">{analysisResult.sceneType}</p>
        </div>
        <div className="bg-studio-bg rounded-lg px-3 py-2.5 text-center">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider">亮度</p>
          <p className="text-xs text-studio-text mt-1 font-medium">{analysisResult.brightness}</p>
        </div>
        <div className="bg-studio-bg rounded-lg px-3 py-2.5 text-center">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider">对比度</p>
          <p className="text-xs text-studio-text mt-1 font-medium">{analysisResult.contrastLevel}</p>
        </div>
      </div>

      {/* 主要颜色 */}
      {analysisResult.dominantColors.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider mb-2">主要颜色</p>
          <div className="flex gap-2">
            {analysisResult.dominantColors.map((color, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-md border border-studio-border shadow-sm"
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
          <p className="text-[10px] text-studio-text-muted font-mono uppercase tracking-wider mb-2">AI 调色建议</p>
          <ul className="space-y-1.5">
            {analysisResult.suggestions.map((suggestion, i) => (
              <li key={i} className="text-xs text-studio-text-dim flex items-start gap-2">
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
      className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center ${mobile ? 'min-h-[240px] py-8' : 'min-h-[360px] py-12'}
        ${isDragOver
          ? 'border-studio-accent bg-studio-accent/5 scale-[1.01]'
          : 'border-studio-border hover:border-studio-accent/50 hover:bg-studio-surface/50'
        }`}
    >
      <div className={`transition-transform duration-300 ${isDragOver ? 'scale-110' : ''}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
          isDragOver ? 'bg-studio-accent/15' : 'bg-studio-surface border border-studio-border'
        }`}>
          {isDragOver ? (
            <ImagePlus size={mobile ? 24 : 28} className="text-studio-accent" />
          ) : (
            <Upload size={mobile ? 22 : 26} className="text-studio-text-muted" />
          )}
        </div>
      </div>

      <p className={`${mobile ? 'text-sm' : 'text-sm'} text-studio-text mb-1 font-medium`}>
        {isDragOver ? '释放以上传图片' : '点击或拖拽图片到此处'}
      </p>
      <p className="text-xs text-studio-text-muted opacity-70">
        AI 将自动分析并完成调色
      </p>
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
