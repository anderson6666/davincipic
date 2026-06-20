import { useState, useCallback, useRef } from 'react';
import { Sparkles, Upload, ImagePlus } from 'lucide-react';
import { useImageStore } from '../../store/useImageStore';
import ProgressBar from '../ui/ProgressBar';

interface MainPanelProps {
  onUpload: () => void;
  onFileDrop?: (file: File) => void;  // 拖拽文件时直接回调
}

/** AI 分析结果面板 */
function AIPanel() {
  const analysisResult = useImageStore((s) => s.analysisResult);
  const isLoading = useImageStore((s) => s.isLoading);
  const uploadProgress = useImageStore((s) => s.uploadProgress);
  const analysisProgress = useImageStore((s) => s.analysisProgress);
  const currentStage = useImageStore((s) => s.currentStage);

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
    </div>
  );
}

/** 上传区域 - 可点击 + 拖拽 */
function UploadZone({ onUpload, onFileDrop }: { onUpload: () => void; onFileDrop?: (file: File) => void }) {
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
      className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[360px]
        ${isDragOver
          ? 'border-studio-accent bg-studio-accent/5 scale-[1.01]'
          : 'border-studio-border hover:border-studio-accent/50 hover:bg-studio-surface/50'
        }`}
    >
      <div className={`transition-transform duration-300 ${isDragOver ? 'scale-110' : ''}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
          isDragOver ? 'bg-studio-accent/15' : 'bg-studio-surface border border-studio-border'
        }`}>
          {isDragOver ? (
            <ImagePlus size={28} className="text-studio-accent" />
          ) : (
            <Upload size={26} className="text-studio-text-muted" />
          )}
        </div>
      </div>

      <p className="text-sm text-studio-text mb-1 font-medium">
        {isDragOver ? '释放以上传图片' : '点击或拖拽图片到此处'}
      </p>
      <p className="text-xs text-studio-text-muted opacity-70">
        Agnes AI 将自动分析并完成调色
      </p>
      {!isDragOver && (
        <p className="text-[11px] text-studio-text-dim mt-4 px-4 py-2 rounded-lg bg-studio-bg border border-studio-border">
          支持 JPG / PNG / WebP 格式
        </p>
      )}
    </div>
  );
}

/** 中央主面板 */
export default function MainPanel({ onUpload, onFileDrop }: MainPanelProps) {
  const analysisResult = useImageStore((s) => s.analysisResult);
  const isLoading = useImageStore((s) => s.isLoading);

  return (
    <main className="flex-1 bg-studio-bg overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {isLoading ? (
          <AIPanel />
        ) : analysisResult ? (
          <AIPanel />
        ) : (
          <UploadZone onUpload={onUpload} onFileDrop={onFileDrop} />
        )}
      </div>
    </main>
  );
}
