import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Bot, ArrowRight, Palette } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import { useUIStore } from '@/store/useUIStore';
import ProgressBar from '../ui/ProgressBar';

const SCENE_TYPE_MAP: Record<string, string> = {
  portrait: '人像照',
  landscape: '风景照',
  interior: '室内照',
  night: '夜景',
  other: '其他',
};

const BRIGHTNESS_MAP: Record<string, string> = {
  dark: '偏暗',
  normal: '正常',
  bright: '偏亮',
};

const CONTRAST_MAP: Record<string, string> = {
  low: '低',
  medium: '中等',
  high: '高',
};

export default function AIPanel() {
  const aiPanelExpanded = useUIStore((s) => s.aiPanelExpanded);
  const toggleAIPanel = useUIStore((s) => s.toggleAIPanel);
  const originalImageData = useImageStore((s) => s.originalImageData);
  const analysisResult = useImageStore((s) => s.analysisResult);
  const isLoading = useImageStore((s) => s.isLoading);
  const uploadProgress = useImageStore((s) => s.uploadProgress);
  const analysisProgress = useImageStore((s) => s.analysisProgress);
  const currentStage = useImageStore((s) => s.currentStage);

  const hasImage = originalImageData !== null;
  const hasAnalysis = analysisResult !== null;
  const isUploading = uploadProgress < 100;

  return (
    <div className="rounded-lg border border-studio-border bg-studio-panel">
      {/* 头部 */}
      <button
        onClick={toggleAIPanel}
        className="flex w-full items-center justify-between px-4 py-3 font-sans text-sm font-medium text-studio-text transition-colors hover:bg-studio-surface"
      >
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-studio-accent" />
          <span>Agnes 分析</span>
        </div>
        {aiPanelExpanded ? (
          <ChevronUp className="h-4 w-4 text-studio-text-dim" />
        ) : (
          <ChevronDown className="h-4 w-4 text-studio-text-dim" />
        )}
      </button>

      {/* 内容区域 */}
      <AnimatePresence initial={false}>
        {aiPanelExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-studio-border px-4 py-4">
              {/* 未加载图片 */}
              {!hasImage && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Palette className="mb-2 h-10 w-10 text-studio-text-muted" />
                  <p className="font-sans text-sm text-studio-text-dim">
                    上传图片后 AI 将自动分析
                  </p>
                </div>
              )}

              {/* 加载中 - 显示真实进度条 */}
              {hasImage && isLoading && !hasAnalysis && (
                <div className="space-y-4 py-2">
                  {/* 上传进度 */}
                  {isUploading && (
                    <ProgressBar
                      progress={uploadProgress}
                      label={currentStage || '正在读取图片...'}
                      color="bg-studio-accent"
                      size="sm"
                    />
                  )}
                  {/* AI 分析进度 */}
                  {!isUploading && (
                    <ProgressBar
                      progress={analysisProgress}
                      label={currentStage || '正在分析...'}
                      color="bg-studio-warning"
                      size="md"
                    />
                  )}
                </div>
              )}

              {/* 分析结果 */}
              {hasImage && hasAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  {/* 场景类型 */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <span className="font-sans text-sm text-studio-text-dim">
                      场景类型:
                    </span>
                    <span className="font-sans text-sm font-medium text-studio-text">
                      {SCENE_TYPE_MAP[analysisResult.sceneType] || analysisResult.sceneType}
                    </span>
                  </div>

                  {/* 亮度和对比度 */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span>💡</span>
                      <span className="font-sans text-sm text-studio-text-dim">
                        亮度:
                      </span>
                      <span className="font-sans text-sm text-studio-text">
                        {BRIGHTNESS_MAP[analysisResult.brightness] || analysisResult.brightness}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm text-studio-text-dim">|</span>
                      <span className="font-sans text-sm text-studio-text-dim">
                        对比度:
                      </span>
                      <span className="font-sans text-sm text-studio-text">
                        {CONTRAST_MAP[analysisResult.contrastLevel] || analysisResult.contrastLevel}
                      </span>
                    </div>
                  </div>

                  {/* 主要颜色 */}
                  {analysisResult.dominantColors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span>🎨</span>
                      <span className="font-sans text-sm text-studio-text-dim">
                        主要颜色:
                      </span>
                      <div className="flex gap-2">
                        {analysisResult.dominantColors.map((color, index) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="h-6 w-6 rounded-full border-2 border-studio-border shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 调色建议 */}
                  {analysisResult.suggestions.length > 0 && (
                    <div className="mt-2">
                      <div className="mb-2 flex items-center gap-2">
                        <span>💬</span>
                        <span className="font-sans text-sm font-medium text-studio-text">
                          调色建议:
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {analysisResult.suggestions.map((suggestion, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="flex items-start gap-2 rounded-md bg-studio-surface px-3 py-2"
                          >
                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-studio-accent" />
                            <span className="font-sans text-sm text-studio-text-dim">
                              {suggestion}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
