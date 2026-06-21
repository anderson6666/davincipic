import { motion } from 'framer-motion';
import {
  X, Loader2, CheckCircle2, XCircle, Clock, Image,
  Sparkles, ShieldCheck, Star, AlertTriangle, Download,
} from 'lucide-react';
import type { TaskStatus, BatchTask } from '../../store/useBatchStore';
import ProgressBar from '../ui/ProgressBar';

interface BatchTaskCardProps {
  task: BatchTask;
  sourceThumbnail: string | null;
  onReset: (taskId: string) => void;
}

/** 状态配置 */
const STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  animClass?: string;
}> = {
  idle:          { label: '等待',   color: 'text-studio-text-dim', bgColor: 'bg-white/[0.02]', borderColor: 'border-white/[0.06]', icon: Clock },
  loading:       { label: '读取',   color: 'text-studio-accent',    bgColor: 'bg-studio-accent/[0.04]', borderColor: 'border-studio-accent/20', icon: Loader2, animClass: 'animate-spin' },
  analyzing:     { label: 'AI分析', color: 'text-studio-warning',   bgColor: 'bg-studio-warning/[0.04]', borderColor: 'border-studio-warning/20', icon: Sparkles, animClass: 'animate-pulse' },
  completed:     { label: 'V1完成', color: 'text-studio-success',   bgColor: 'bg-studio-success/[0.05]', borderColor: 'border-studio-success/25', icon: CheckCircle2 },
  error:         { label: '失败',   color: 'text-red-400',         bgColor: 'bg-red-500/[0.04]',        borderColor: 'border-red-500/20',         icon: XCircle },
  reviewing:     { label: '复查中', color: 'text-studio-purple',    bgColor: 'bg-studio-purple/[0.06]',  borderColor: 'border-studio-purple/25', icon: ShieldCheck, animClass: 'animate-bounce' },
  reviewed:      { label: 'V2成品', color: 'text-studio-purple',    bgColor: 'bg-gradient-to-br from-studio-purple/[0.08] to-studio-accent/[0.04]', borderColor: 'border-studio-purple/30 ring-1 ring-studio-purple/15', icon: Star },
  review_error:  { label: '复查失败',color: 'text-orange-400',      bgColor: 'bg-orange-500/[0.04]',     borderColor: 'border-orange-500/20',     icon: XCircle },
};

/** 触发下载 */
function downloadImage(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function BatchTaskCard({ task, sourceThumbnail, onReset }: BatchTaskCardProps) {
  const config = STATUS_CONFIG[task.status];
  const StatusIcon = config.icon;
  const isActive = task.status === 'loading' || task.status === 'analyzing' || task.status === 'reviewing';
  const hasV1Result = task.status === 'completed' || task.status === 'reviewed' || task.status === 'review_error';
  const hasV2Result = task.status === 'reviewed';

  /** 当前应展示的高清效果图 */
  const displayImage = hasV2Result && task.v2ResultImage
    ? task.v2ResultImage
    : hasV1Result && task.v1ResultImage
      ? task.v1ResultImage
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${config.bgColor} ${config.borderColor} ${
        isActive ? 'shadow-lg shadow-black/20' : ''
      }`}
    >
      {/* ===== 缩略图 / 效果图区域 ===== */}
      <div className="aspect-[4/5] sm:aspect-square bg-studio-bg relative overflow-hidden">
        {/* 空闲状态：显示源图缩略图 + 槽位标签 */}
        {task.status === 'idle' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-3">
            {sourceThumbnail ? (
              <img src={sourceThumbnail} alt="源图" className="w-full h-full object-cover rounded-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            ) : (
              <div className="w-full h-full rounded-lg bg-white/[0.03] flex items-center justify-center">
                <Image size={28} className="text-white/10" />
              </div>
            )}
            {/* 槽位标签覆盖 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-xs font-mono text-white/60 border border-white/10">
                #{task.slotIndex + 1} {task.label}
              </span>
            </div>
          </div>
        )}

        {/* 处理中：显示源图 + 状态动画 */}
        {isActive && (
          <>
            {sourceThumbnail && (
              <img src={sourceThumbnail} alt="" className="w-full h-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center gap-2">
              <StatusIcon size={24} className={`${config.color} ${config.animClass || ''}`} />
              <span className="text-xs font-mono text-white/80">{config.label}</span>
            </div>
          </>
        )}

        {/* 有结果：显示高清效果图 */}
        {displayImage && (
          <>
            <img
              src={displayImage}
              alt={`${task.label} 调色效果`}
              className="w-full h-full object-cover"
            />
            {/* 底部渐变遮罩（放按钮和信息） */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

            {/* 右上角：版本标记 */}
            <div className="absolute top-2 right-2 flex gap-1">
              {hasV1Result && !hasV2Result && (
                <span className="px-1.5 py-0.5 rounded-md bg-studio-accent/90 backdrop-blur-sm text-[9px] font-mono font-bold text-black leading-none">V1</span>
              )}
              {hasV2Result && task.reviewVerdict && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-studio-purple/90 backdrop-blur-sm text-[9px] font-mono font-bold text-white leading-none">
                  <Star size={8} fill="white" />{task.reviewVerdict.overallScore}
                </span>
              )}
            </div>

            {/* 右下角：状态图标 */}
            <div className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${
              task.status === 'reviewed' ? 'bg-studio-purple' :
              task.status === 'completed' ? 'bg-studio-success' :
              'bg-red-500'
            }`}>
              {task.status === 'reviewed'
                ? <ShieldCheck size={14} className="text-white" />
                : task.status === 'completed'
                  ? <CheckCircle2 size={14} className="text-black" />
                  : <XCircle size={14} className="text-white" />
              }
            </div>

            {/* 左下角：下载按钮（hover 显示） */}
            <button
              onClick={(e) => { e.stopPropagation(); downloadImage(displayImage!, `${task.label}_${Date.now()}.jpg`); }}
              className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="下载高清效果图"
            >
              <Download size={13} className="text-studio-bg" />
            </button>
          </>
        )}

        {/* 错误状态 */}
        {(task.status === 'error' || task.status === 'review_error') && (
          <>
            {sourceThumbnail && (
              <img src={sourceThumbnail} alt="" className="w-full h-full object-cover opacity-20" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <XCircle size={28} className="text-red-400/70" />
            </div>
          </>
        )}

        {/* 序号标签（左上角） */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-[10px] font-mono text-white/50 tabular-nums">
            {task.slotIndex + 1}
          </span>
        </div>
      </div>

      {/* ===== 信息区 ===== */}
      <div className="p-2.5 space-y-1.5">
        {/* 标题行：标签名 + 重置按钮 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-white/90 truncate font-mono">{task.label}</span>
          {!isActive && task.status !== 'idle' && (
            <button
              onClick={() => onReset(task.id)}
              className="ml-auto w-4 h-4 rounded flex items-center justify-center hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
              title="重置此任务"
            >
              <X size={9} />
            </button>
          )}
        </div>

        {/* 状态行 */}
        <div className={`flex items-center gap-1 text-[9px] font-mono ${config.color}`}>
          <StatusIcon size={10} className={config.animClass || ''} />
          <span>{config.label}</span>
          {task.duration != null && !hasV2Result && (
            <span className="ml-auto text-white/30 tabular-nums">{(task.duration / 1000).toFixed(1)}s</span>
          )}
          {task.v2Duration != null && hasV2Result && (
            <span className="ml-auto text-white/30 tabular-nums">{(task.v2Duration / 1000).toFixed(1)}s</span>
          )}
        </div>

        {/* 进度条 */}
        {(task.status === 'loading' || task.status === 'analyzing') && (
          <ProgressBar
            progress={task.status === 'loading' ? task.uploadProgress : task.analysisProgress}
            label={task.currentStage}
            color={task.status === 'loading' ? 'bg-studio-accent' : 'bg-studio-warning'}
            size="sm"
            showPercent={false}
          />
        )}
        {task.status === 'reviewing' && (
          <ProgressBar
            progress={task.reviewProgress}
            label={task.reviewStage}
            color="bg-studio-purple"
            size="sm"
            showPercent={false}
          />
        )}

        {/* 错误信息 */}
        {task.error && (task.status === 'error' || task.status === 'review_error') && (
          <p className="text-[8px] text-red-400/80 line-clamp-2 leading-tight">{task.error}</p>
        )}

        {/* V1 摘要 */}
        {hasV1Result && task.analysisResult && (
          <div className="grid grid-cols-3 gap-0.5 pt-1 border-t border-white/[0.05]">
            <div className="bg-white/[0.03] rounded px-1 py-0.5 text-center">
              <p className="text-[7px] text-white/30">场景</p>
              <p className="text-[8px] text-white/60 truncate">{task.analysisResult.sceneType}</p>
            </div>
            <div className="bg-white/[0.03] rounded px-1 py-0.5 text-center">
              <p className="text-[7px] text-white/30">亮度</p>
              <p className="text-[8px] text-white/60">{task.analysisResult.brightness}</p>
            </div>
            <div className="bg-white/[0.03] rounded px-1 py-0.5 text-center">
              <p className="text-[7px] text-white/30">节点</p>
              <p className="text-[8px] text-studio-accent font-medium tabular-ns">{task.commands?.length ?? 0}</p>
            </div>
          </div>
        )}

        {/* V2 复查结果 */}
        {hasV2Result && task.reviewVerdict && (
          <div className="space-y-1 pt-1 border-t border-studio-purple/15">
            {/* 评分 */}
            <div className="flex items-center gap-1.5">
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                task.reviewVerdict.overallScore >= 7 ? 'bg-emerald-500/20 text-emerald-400' :
                task.reviewVerdict.overallScore >= 5 ? 'bg-amber-500/20 text-amber-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                <Star size={8} fill="currentColor" />{task.reviewVerdict.overallScore}/10
              </span>
              <span className={`text-[8px] px-1 py-px rounded ${
                task.reviewVerdict.verdict === '通过' ? 'bg-emerald-500/10 text-emerald-400/80' :
                task.reviewVerdict.verdict === '需要修改' ? 'bg-amber-500/10 text-amber-400/80' :
                'bg-orange-500/10 text-orange-400/80'
              }`}>
                {task.reviewVerdict.verdict}
              </span>
            </div>

            {/* V1 vs V2 对比 */}
            <div className="grid grid-cols-2 gap-0.5">
              <div className="bg-white/[0.02] rounded px-1 py-0.5 text-center">
                <p className="text-[7px] text-white/25">V1</p>
                <p className="text-[8px] text-white/40 tabular-nums">{task.commands?.length ?? 0}</p>
              </div>
              <div className="bg-studio-purple/[0.08] rounded px-1 py-0.5 text-center">
                <p className="text-[7px] text-studio-purple/50">V2成品</p>
                <p className="text-[8px] text-studio-purple font-medium tabular-nums">{task.v2Commands?.length ?? 0}</p>
              </div>
            </div>

            {/* 问题提示 */}
            {task.reviewVerdict.issues.length > 0 && (
              <div className="flex items-start gap-1">
                <AlertTriangle size={8} className="text-amber-400/60 shrink-0 mt-0.5" />
                <p className="text-[7px] text-white/35 line-clamp-1">
                  {task.reviewVerdict.issues[0]}
                  {task.reviewVerdict.issues.length > 1 && ` (+${task.reviewVerdict.issues.length - 1})`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 下载按钮（始终可见，有结果时显示） */}
        {displayImage && (
          <button
            onClick={() => downloadImage(displayImage, `${task.label}_成品_${Date.now()}.jpg`)}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-white/60 hover:text-white transition-all border border-white/[0.06]"
          >
            <Download size={11} />
            下载高清效果图
          </button>
        )}
      </div>
    </motion.div>
  );
}
