import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, Play, Trash2, Layers,
  CheckCircle2, Loader2, ShieldCheck, Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { useBatchStore, type BatchTask } from '../../store/useBatchStore';
import BatchTaskCard from './BatchTaskCard';
import BatchHistoryPanel from './BatchHistoryPanel';
import { analyzeAndGrade, type AutoGradeResult } from '../../ai/agnes/imageAnalyzer';
import { reviewAndRefine } from '../../ai/agnes/imageAnalyzer';
import { generateGradedImage } from '../../ai/agnes/gradePreview';

type TabType = 'tasks' | 'history';

function getAnalysisStage(pct: number): string {
  if (pct < 15) return '连接 Agnes AI...';
  if (pct < 35) return '分析图像内容...';
  if (pct < 60) return '识别场景与色彩...';
  if (pct < 85) return '生成调色方案...';
  return '整理结果...';
}

function getReviewStage(pct: number): string {
  if (pct < 20) return '首席调色师审查中...';
  if (pct < 45) return '检测过度调整...';
  if (pct < 70) return '生成精炼方案(V2)...';
  if (pct < 90) return '对比V1差异分析...';
  return '完成第二版成品...';
}

/** File → ImageData */
async function fileToImageData(file: File, onProgress?: (pct: number) => void): Promise<ImageData> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.onprogress = (e: ProgressEvent) => {
      if (e.lengthComputable && e.total > 0 && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export default function BatchPanel({ onToggleBatchMode }: { onToggleBatchMode?: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const abortRefs = useRef<Map<string, AbortController>>(new Map());
  /** 缓存源图的 ImageData（所有任务共享） */
  const sourceImageDataCache = useRef<ImageData | null>(null);

  const {
    tasks, sourceFile, sourceThumbnail,
    isProcessing, isReviewing, completedCount, reviewedCount,
    setSourceImage, resetTask, clearAll, updateTask,
    setProcessing, setReviewing, finishBatch,
  } = useBatchStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 防止快速重复点击的守卫（同步生效，不依赖 React 重渲染） */
  const isStartingRef = useRef(false);

  /**
   * 阶段1：处理单个任务 — AI 分析 + 生成 V1 高清效果图
   * 所有任务共享同一个 sourceImageDataCache
   */
  const processSingleTask = useCallback(async (task: BatchTask) => {
    const sourceData = sourceImageDataCache.current;
    if (!sourceData || !sourceFile) return;

    const startTime = Date.now();
    updateTask(task.id, { status: 'loading', startTime });

    try {
      // 读取（共用缓存，模拟进度）
      updateTask(task.id, { currentStage: '读取图片数据...', uploadProgress: 100 });

      // AI 分析
      updateTask(task.id, { status: 'analyzing', currentStage: '连接 Agnes AI...', analysisProgress: 42 });

      const aiResult: AutoGradeResult = await analyzeAndGrade(sourceData, (loaded, total) => {
        const rawPct = Math.min(loaded / Math.max(total, 1), 1);
        updateTask(task.id, {
          analysisProgress: Math.round(42 + rawPct * 51),
          currentStage: getAnalysisStage(rawPct * 100),
        });
      });

      // 生成 V1 高清效果图
      let v1Image: string;
      try {
        v1Image = generateGradedImage(sourceData, aiResult.commands);
      } catch {
        v1Image = '';
      }

      const duration = Date.now() - startTime;
      updateTask(task.id, {
        status: 'completed',
        analysisProgress: 100,
        currentStage: 'V1完成',
        analysisResult: aiResult.analysis,
        commands: aiResult.commands,
        duration,
        v1Result: aiResult,
        v1ResultImage: v1Image,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTask(task.id, {
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误',
        duration,
      });
    }
  }, [sourceFile, updateTask]);

  /**
   * 阶段2：复查单个任务 — 发送原图+V1效果图给AI → 获取V2 + 生成V2高清图
   */
  const reviewSingleTask = useCallback(async (task: BatchTask) => {
    if (!task.v1Result) return;

    const sourceData = sourceImageDataCache.current;
    if (!sourceData && !sourceFile) return;

    const reviewStartTime = Date.now();
    updateTask(task.id, { status: 'reviewing', reviewProgress: 5, reviewStage: '准备复查数据...' });

    try {
      // 如果缓存没有，重新读取
      let imageData = sourceData;
      if (!imageData && sourceFile) {
        imageData = await fileToImageData(sourceFile);
        sourceImageDataCache.current = imageData;
      }
      if (!imageData) throw new Error('无法获取图像数据');

      updateTask(task.id, { reviewStage: '发送给首席调色师...', reviewProgress: 10 });

      const reviewResult = await reviewAndRefine(imageData, task.v1Result, (loaded, total) => {
        const rawPct = Math.min(loaded / Math.max(total, 1), 1);
        updateTask(task.id, {
          reviewProgress: Math.round(10 + rawPct * 80),
          reviewStage: getReviewStage(rawPct * 100),
        });
      });

      // 生成 V2 高清成品图
      let v2Image: string;
      try {
        v2Image = generateGradedImage(imageData, reviewResult.v2Commands);
      } catch {
        v2Image = task.v1ResultImage ?? '';
      }

      const v2Duration = Date.now() - reviewStartTime;
      updateTask(task.id, {
        status: 'reviewed',
        reviewProgress: 100,
        reviewStage: '第二版完成',
        reviewVerdict: reviewResult.review,
        v2AnalysisResult: reviewResult.v2Analysis,
        v2Suggestions: reviewResult.v2Suggestions,
        v2Commands: reviewResult.v2Commands,
        v2Reasoning: reviewResult.v2Reasoning,
        v2Duration,
        v2ResultImage: v2Image,
      });
    } catch (error) {
      const v2Duration = Date.now() - reviewStartTime;
      updateTask(task.id, {
        status: 'review_error',
        reviewStage: '复查失败',
        error: error instanceof Error ? error.message : '复查未知错误',
        v2Duration,
      });
    }
  }, [sourceFile, updateTask]);

  /** 开始全部10个任务（并行处理同一张图） */
  const startAll = useCallback(async () => {
    if (isStartingRef.current) return; // 防抖：已在启动中
    const idleTasks = tasks.filter((t) => t.status === 'idle');
    if (idleTasks.length === 0) return;

    isStartingRef.current = true; // 立即锁定，防止重复点击

    // 预加载源图 ImageData 到缓存（只读一次）
    if (!sourceImageDataCache.current && sourceFile) {
      sourceImageDataCache.current = await fileToImageData(sourceFile);
    }

    setProcessing(true);
    setReviewing(false);

    // 10个任务同时启动！真正的多线程并发
    await Promise.all(idleTasks.map((task) => processSingleTask(task)));

    setProcessing(false);
    isStartingRef.current = false; // 解锁
  }, [tasks, sourceFile, processSingleTask, setProcessing, setReviewing]);

  /** 开始复查（已完成V1的任务进入V2） */
  const startReview = useCallback(async () => {
    if (isStartingRef.current) return; // 防抖：已在启动中
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    if (completedTasks.length === 0) return;

    isStartingRef.current = true; // 立即锁定，防止重复点击

    setProcessing(true); setReviewing(true); // 同步设置状态 → 按钮立即隐藏

    await Promise.all(completedTasks.map((t) => reviewSingleTask(t)));

    setProcessing(false); setReviewing(false);
    isStartingRef.current = false; // 解锁
  }, [tasks, reviewSingleTask, setProcessing, setReviewing]);

  /** 选择文件 */
  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    sourceImageDataCache.current = null; // 清除旧图缓存
    await setSourceImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* 拖拽 */
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.types.includes('Files')) setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragOver(false); } };
  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); dragCounter.current = 0; const file = e.dataTransfer.files[0]; if (file?.type.startsWith('image/')) { sourceImageDataCache.current = null; await setSourceImage(file); } };

  const idleCount = tasks.filter((t) => t.status === 'idle').length;
  const activeCount = tasks.filter((t) => ['loading', 'analyzing', 'reviewing'].includes(t.status)).length;
  const canReview = !isReviewing && !isProcessing && tasks.some((t) => t.status === 'completed');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-studio-bg">
      {/* ===== 工具栏 ===== */}
      <header className="shrink-0 border-b border-white/[0.06] px-4 py-3 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
        {/* 左侧 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Layers size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white">多线程批量模式</h2>
              <p className="text-[9px] text-white/30 hidden sm:block">1张图 · 10方案 · 并行AI调色</p>
            </div>
          </div>

          {/* 统计徽章 */}
          {tasks.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/40 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1">
              {sourceFile && (
                <>
                  <ImageIcon size={10} />
                  <span className="truncate max-w-[120px]">{sourceFile.name}</span>
                  <span className="text-white/15">|</span>
                </>
              )}
              <span>{tasks.length}/10</span>
              {activeCount > 0 && (
                <>
                  <span className="text-white/15">|</span>
                  <Loader2 size={10} className={`animate-spin ${isReviewing ? 'text-violet-400' : 'text-amber-400'}`} />
                  <span className={isReviewing ? 'text-violet-400' : 'text-amber-400'}>
                    {isReviewing ? `复查${reviewedCount}` : `处理${completedCount}`}
                  </span>
                </>
              )}
              {completedCount > 0 && !isReviewing && (
                <>
                  <span className="text-white/15">|</span>
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  <span className="text-emerald-400">{completedCount}</span>
                </>
              )}
              {reviewedCount > 0 && (
                <>
                  <span className="text-white/15">|</span>
                  <ShieldCheck size={10} className="text-violet-400" />
                  <span className="text-violet-400">{reviewedCount}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 右侧：Tab + 模式切换 + 操作 */}
        <div className="flex items-center gap-2">
          {/* 手机端：单张/多线程模式切换 */}
          {typeof onToggleBatchMode === 'function' && (
            <button onClick={onToggleBatchMode}
              className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg border border-cyan-500/25 text-cyan-400 bg-cyan-500/[0.06] hover:bg-cyan-500/12 transition-all font-mono"
            >
              <Layers size={11} /> 单张模式
            </button>
          )}
          <div className="flex bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
            {(['tasks', 'history'] as TabType[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[10px] rounded-md transition-all font-mono ${
                  activeTab === tab ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/35 hover:text-white/60'
                }`}
              >
                {tab === 'tasks' ? '任务列表' : '历史记录'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ===== 内容区 ===== */}
      <main className="flex-1 overflow-auto p-4">
        {activeTab === 'tasks' ? (
          <div className="max-w-6xl mx-auto space-y-4">
            {/* 空状态：上传区域 */}
            {tasks.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-2xl sm:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center min-h-[420px] transition-all duration-300 ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-500/[0.04] scale-[1.005]'
                    : 'border-white/[0.08] hover:border-cyan-400/40 hover:bg-white/[0.02]'
                }`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all ${
                  isDragOver ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 scale-110' : 'bg-white/[0.03] border border-white/[0.06]'
                }`}>
                  {isDragOver
                    ? <Sparkles size={32} className="text-cyan-400 animate-pulse" />
                    : <Upload size={28} className="text-white/25" />
                  }
                </div>
                <p className="text-base text-white/80 font-medium mb-1">
                  {isDragOver ? '释放以上传图片' : '点击或拖拽一张图片到此处'}
                </p>
                <p className="text-sm text-white/30 mb-6">上传后将自动创建 10 个并行调色任务</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['10路并发', '自动缩略图', 'AI调色+复查', '高清下载'].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 text-[10px] rounded-full bg-white/[0.04] text-white/30 border border-white/[0.05]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* 源图预览条 */}
                {sourceThumbnail && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <img src={sourceThumbnail} alt="源图" className="w-12 h-12 rounded-lg object-cover border border-white/[0.08]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-white/70 truncate">{sourceFile?.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">源图像 · 10个任务将基于此图并行处理</p>
                    </div>
                    <button onClick={() => clearAll()} disabled={isProcessing}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-[10px] rounded-lg border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-30"
                    >
                      <Trash2 size={11} /> 更换图片
                    </button>
                  </div>
                )}

                {/* 操作按钮行 */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {/* 换图按钮已移除，仅保留源图预览条中的更换图片 */}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isProcessing && !isReviewing && idleCount > 0 && (
                      <button onClick={startAll}
                        className="flex items-center gap-1.5 px-5 py-2.5 text-xs rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                      >
                        <Play size={13} /> 全部开始 ({idleCount})
                      </button>
                    )}

                    {!isProcessing && !isReviewing && canReview && (
                      <button onClick={startReview}
                        className="flex items-center gap-1.5 px-5 py-2.5 text-xs rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-mono font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                      >
                        <ShieldCheck size={13} /> 开始复查 ({completedCount})
                      </button>
                    )}

                    {/* 复查进行中：显示进度，不提供停止/取消按钮 */}
                    {isReviewing && (
                      <div className="flex items-center gap-1.5 px-5 py-2.5 text-xs rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono">
                        <Loader2 size={13} className="animate-spin" />
                        复查中 ({reviewedCount}/{completedCount})
                      </div>
                    )}

                    {/* V1处理中：显示进度 */}
                    {isProcessing && !isReviewing && (
                      <div className="flex items-center gap-1.5 px-5 py-2.5 text-xs rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
                        <Loader2 size={13} className="animate-spin" />
                        处理中 ({completedCount}/10)
                      </div>
                    )}

                    {!isProcessing && !isReviewing && reviewedCount > 0 && (
                      <button onClick={finishBatch}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs rounded-xl border border-emerald-500/25 text-emerald-400 bg-emerald-500/[0.06] font-mono hover:bg-emerald-500/12 transition-all"
                      >
                        <CheckCircle2 size={13} /> 存入历史
                      </button>
                    )}
                  </div>
                </div>

                {/* 阶段提示横幅 */}
                {!isReviewing && completedCount > 0 && reviewedCount === 0 && !isProcessing && (
                  <div className="rounded-xl bg-gradient-to-r from-violet-500/8 to-purple-500/8 border border-violet-500/15 px-4 py-3 flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-violet-400 shrink-0" />
                    <span className="text-xs text-white/70">
                      第一版已完成！点击 <strong className="text-violet-300 mx-1">开始复查</strong> 将结果发给首席调色师审查，生成更精炼的<strong className="text-violet-300 mx-1">第二版成品</strong>
                    </span>
                  </div>
                )}
                {isReviewing && (
                  <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/8 border border-violet-500/20 px-4 py-3 flex items-center gap-2.5">
                    <Loader2 size={16} className="text-violet-400 animate-spin shrink-0" />
                    <span className="text-xs text-white/70">
                      正在进行复查精炼...
                      <span className="text-violet-300 ml-1 tabular-ns font-mono font-bold">{reviewedCount}/{completedCount}</span>
                      已生成第二版成品
                    </span>
                  </div>
                )}

                {/* 10个任务网格 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {tasks.map((task) => (
                    <BatchTaskCard
                      key={task.id}
                      task={task}
                      sourceThumbnail={sourceThumbnail}
                      onReset={resetTask}
                    />
                  ))}
                </div>
              </>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelectFile} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto"><BatchHistoryPanel /></div>
        )}
      </main>
    </div>
  );
}
