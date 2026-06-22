import { Undo2, Redo2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useHistoryStore } from '@/store/useHistoryStore';

interface BottomBarProps {
  className?: string;
}

export default function BottomBar({ className = '' }: BottomBarProps) {
  const { history, currentIndex, goToIndex } = useHistoryStore();

  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < history.length - 1) {
      goToIndex(currentIndex + 1);
    }
  };

  return (
    <footer className={`h-14 glass-panel border-t border-studio-border flex items-center justify-between px-4 ${className} top-highlight`}>
      {/* 左侧：步骤计数 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-studio-text-muted" />
          <span className="text-xs font-mono text-studio-text-dim">
            步骤{' '}
            <span className="text-studio-accent font-bold tabular-nums">{currentIndex + 1}</span>
            <span className="text-studio-text-muted mx-0.5">/</span>
            <span className="tabular-nums">{history.length || 0}</span>
          </span>
        </div>

        {/* 导航按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            disabled={currentIndex <= 0}
            className="w-7 h-7 rounded-lg bg-studio-surface/70 border border-studio-border hover:border-studio-accent hover:text-studio-accent hover:shadow-glow-sm transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:border-studio-border disabled:hover:shadow-none"
            title="上一步"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= history.length - 1}
            className="w-7 h-7 rounded-lg bg-studio-surface/70 border border-studio-border hover:border-studio-accent hover:text-studio-accent hover:shadow-glow-sm transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:border-studio-border disabled:hover:shadow-none"
            title="下一步"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 中间：历史时间轴（水平缩略图列表） */}
      <div className="flex-1 mx-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max h-10">
          {history.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-studio-text-muted">
              <Clock size={12} className="mr-1.5 opacity-50" />
              暂无操作历史
            </div>
          ) : (
            history.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => goToIndex(index)}
                className={`relative group flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-studio-accent shadow-glow-sm scale-105'
                    : 'border-studio-border hover:border-studio-accent/50 hover:scale-105'
                }`}
                title={`${entry.description}\n${new Date(entry.timestamp).toLocaleTimeString()}`}
              >
                {/* 缩略图 */}
                {entry.thumbnail ? (
                  <img
                    src={entry.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-studio-surface flex items-center justify-center">
                    <span className="text-[10px] font-mono text-studio-text-muted">
                      {index + 1}
                    </span>
                  </div>
                )}

                {/* 当前步骤指示器 */}
                {index === currentIndex && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-studio-accent to-cyan-400" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 右侧：快捷键提示 */}
      <div className="flex items-center gap-3 text-[11px] text-studio-text-muted font-mono">
        <div className="flex items-center gap-1.5">
          <Undo2 size={12} />
          <kbd className="px-1.5 py-0.5 rounded bg-studio-surface/70 border border-studio-border text-studio-text-dim">Ctrl+Z</kbd>
        </div>
        <div className="flex items-center gap-1.5">
          <Redo2 size={12} />
          <kbd className="px-1.5 py-0.5 rounded bg-studio-surface/70 border border-studio-border text-studio-text-dim">Ctrl+Y</kbd>
        </div>
      </div>
    </footer>
  );
}
