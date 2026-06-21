import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Trash2, RotateCcw, ChevronDown, Clock,
  CheckCircle2, XCircle, Image, Download, Star,
  ShieldCheck,
} from 'lucide-react';
import { useBatchStore, type BatchHistoryEntry } from '../../store/useBatchStore';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function downloadImage(dataUrl: string, fileName: string) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

export default function BatchHistoryPanel() {
  const { history, clearHistory, restoreFromHistory } = useBatchStore();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-violet-500/8 to-transparent flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-2xl blur-xl" />
          <History size={28} className="text-white/20" />
        </div>
        <p className="text-sm text-white/40 font-medium">暂无历史记录</p>
        <p className="text-xs text-white/20 mt-1">完成批量处理后记录会保存在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={15} className="text-cyan-400" />
          <h3 className="text-sm font-mono font-semibold text-white/80">历史记录</h3>
          <span className="text-[10px] text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.05]">
            {history.length}
          </span>
        </div>
        <button onClick={clearHistory}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg border border-red-500/15 text-red-400/60 hover:bg-red-500/8 hover:text-red-400 transition-all"
        >
          <Trash2 size={11} /> 清空
        </button>
      </div>

      {/* 历史列表 */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} onRestore={() => restoreFromHistory(entry.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** 单条历史卡片 */
function HistoryCard({ entry, onRestore }: { entry: BatchHistoryEntry; onRestore: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const successCount = entry.tasks.filter((t) => t.status === 'reviewed' || t.status === 'completed').length;
  const failCount = entry.tasks.filter((t) => t.status === 'error' || t.status === 'review_error').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.1] transition-colors"
    >
      {/* 摘要行 */}
      <button onClick={onRestore} className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors text-left">
        {/* 源图缩略图 */}
        <div className="w-[72px] h-[48px] rounded-lg overflow-hidden shrink-0 border border-white/[0.06] relative">
          {entry.sourceThumbnail ? (
            <img src={entry.sourceThumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
              <Image size={14} className="text-white/10" />
            </div>
          )}
          {/* 任务结果覆盖指示 */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-1">
            {successCount > 0 && (
              <span className="flex items-center gap-0.5 text-[7px] text-emerald-400 tabular-ns">
                <CheckCircle2 size={7} />{successCount}
              </span>
            )}
            {failCount > 0 && (
              <span className="flex items-center gap-0.5 text-[7px] text-red-400 tabular-ns">
                <XCircle size={7} />{failCount}
              </span>
            )}
          </div>
        </div>

        {/* 信息 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={11} className="text-white/25 shrink-0" />
            <span className="text-[11px] font-mono text-white/35">{formatTime(entry.timestamp)}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/30 truncate">
              <Image size={10} className="shrink-0" />
            <span className="truncate">{entry.sourceFileName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-white/25">
            <span>{entry.tasks.length} 个方案</span>
            <span className="text-white/10">|</span>
            <span>{(entry.totalDuration / 1000).toFixed(1)}s</span>
            {entry.tasks.some((t) => t.status === 'reviewed') && (
              <>
                <span className="text-white/10">|</span>
                <ShieldCheck size={9} className="text-violet-400/60" />
                <span className="text-violet-400/50">含V2成品</span>
              </>
            )}
          </div>
        </div>

        {/* 展开 + 恢复 */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          >
            <ChevronDown size={13} className={`text-white/25 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </button>

      {/* 展开详情：10个任务的结果网格 + 下载 */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] space-y-2">
              {/* 任务结果网格（每个任务显示效果图+下载） */}
              <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-1.5">
                {entry.tasks.map((task, i) => {
                  const img = task.v2ResultImage || task.v1ResultImage;
                  const isV2 = !!task.v2ResultImage;
                  const isDone = task.status === 'reviewed' || task.status === 'completed';

                  return (
                    <div key={i} className={`rounded-lg overflow-hidden border ${
                      isDone ? (isV2 ? 'border-violet-500/20' : 'border-emerald-500/15') :
                      task.status === 'error' || task.status === 'review_error' ? 'border-red-500/12' : 'border-white/[0.04]'
                    }`}>
                      {/* 效果图 */}
                      <div className="aspect-square bg-studio-bg relative group/result">
                        {img ? (
                          <>
                            <img src={img} alt={task.label} className="w-full h-full object-cover" />
                            {/* Hover 遮罩 + 下载按钮 */}
                            <div className="absolute inset-0 bg-black/0 group-hover/result:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover/result:opacity-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadImage(img, `${task.label}_成品.jpg`); }}
                                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
                              >
                                <Download size={14} className="text-studio-bg" />
                              </button>
                            </div>
                            {/* 版本标记 */}
                            <div className="absolute top-1 right-1">
                              {isV2 && task.reviewVerdict ? (
                                <span className="flex items-center gap-0.5 px-1 py-px rounded bg-violet-500/80 text-[7px] font-mono font-bold text-white leading-none">
                                  <Star size={6} fill="white" />{task.reviewVerdict.overallScore}
                                </span>
                              ) : isDone ? (
                                <span className="px-1 py-px rounded bg-emerald-500/80 text-[7px] font-mono text-black leading-none">V1</span>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {isDone ? <CheckCircle2 size={18} className="text-emerald-400/40" /> :
                             task.status === 'error' || task.status === 'review_error' ? <XCircle size={18} className="text-red-400/40" /> :
                             <Image size={16} className="text-white/8" />}
                          </div>
                        )}
                      </div>
                      {/* 标签名 */}
                      <div className="p-1 bg-white/[0.01]">
                        <p className="text-[8px] font-mono text-white/35 truncate text-center">{task.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 批量下载全部 V2 成品 */}
              {entry.tasks.some((t) => t.v2ResultImage) && (
                <button
                  onClick={() => {
                    entry.tasks.forEach((t, idx) => {
                      const img = t.v2ResultImage;
                      if (img) setTimeout(() => downloadImage(img, `${t.label}_V2成品_${idx}.jpg`), idx * 200);
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-violet-500/20 text-violet-400/70 hover:bg-violet-500/8 hover:text-violet-300 text-[11px] font-mono transition-all"
                >
                  <Download size={13} /> 批量下载全部成品 ({entry.tasks.filter((t) => t.v2ResultImage).length} 张)
                </button>
              )}

              {/* 恢复按钮 */}
              <button onClick={onRestore}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/[0.08] text-white/35 hover:text-white/60 hover:bg-white/[0.03] text-[11px] font-mono transition-all"
              >
                <RotateCcw size={13} /> 恢复此批次到任务列表（可重新处理）
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
