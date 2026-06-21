import { motion } from 'framer-motion';

interface ProgressBarProps {
  /** 当前进度 0-100 */
  progress: number;
  /** 阶段描述文字 */
  label?: string;
  /** 是否显示百分比 */
  showPercent?: boolean;
  /** 自定义颜色类名 */
  color?: string;
  /** 高度 */
  size?: 'sm' | 'md';
}

export default function ProgressBar({
  progress,
  label,
  showPercent = true,
  color = 'bg-studio-accent',
  size = 'md',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {/* 标签行 */}
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs text-studio-text-dim font-sans flex items-center gap-1.5 truncate">
              <span
                className="w-1.5 h-1.5 rounded-full bg-studio-accent animate-pulse shrink-0"
                style={{ animationDuration: '1.2s' }}
              />
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-[11px] font-mono text-studio-text-muted tabular-nums shrink-0 ml-2">
              {clamped}%
            </span>
          )}
        </div>
      )}

      {/* 进度条轨道 */}
      <div
        className={`w-full rounded-full overflow-hidden bg-studio-surface border border-studio-border ${
          size === 'sm' ? 'h-1.5' : 'h-2'
        }`}
      >
        <motion.div
          className={`h-full rounded-full ${color} relative`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* 光泽效果 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
