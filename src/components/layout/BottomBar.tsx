import { Undo2, Redo2, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <footer className={`h-14 bg-studio-panel/80 backdrop-blur-sm border-t border-studio-border flex items-center justify-between px-4 ${className}`}>
      {/* 左侧：步骤计数 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-studio-text-dim">
          步骤{' '}
          <span className="text-studio-accent font-bold">
            {currentIndex + 1}
          </span>
          /{history.length || 0}
        </span>

        {/* 导航按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            disabled={currentIndex <= 0}
            className="w-7 h-7 rounded bg-studio-surface border border-studio-border hover:border-studio-accent transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:border-studio-border"
            title="上一步"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= history.length - 1}
            className="w-7 h-7 rounded bg-studio-surface border border-studio-border hover:border-studio-accent transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:border-studio-border"
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
              暂无操作历史
            </div>
          ) : (
            history.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => goToIndex(index)}
                className={`relative group flex-shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-studio-accent shadow-glow-sm'
                    : 'border-studio-border hover:border-studio-accent/50'
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
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-studio-accent" />
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
          <kbd className="px-1.5 py-0.5 rounded bg-studio-surface border border-studio-border">Ctrl+Z</kbd>
        </div>
        <div className="flex items-center gap-1.5">
          <Redo2 size={12} />
          <kbd className="px-1.5 py-0.5 rounded bg-studio-surface border border-studio-border">Ctrl+Y</kbd>
        </div>
      </div>
    </footer>
  );
}
