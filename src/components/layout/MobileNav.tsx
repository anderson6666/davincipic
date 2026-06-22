import { Eye, GitBranch, Sparkles, Layers } from 'lucide-react';

type MobileTab = 'preview' | 'nodes' | 'ai';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onToggleBatch?: () => void;
}

const tabs: { key: MobileTab; label: string; icon: React.ElementType }[] = [
  { key: 'preview', label: '预览', icon: Eye },
  { key: 'nodes', label: '节点', icon: GitBranch },
  { key: 'ai', label: 'AI', icon: Sparkles },
];

export default function MobileNav({ activeTab, onTabChange, onToggleBatch }: MobileNavProps) {
  return (
    <nav className="lg:hidden h-16 glass-panel border-t border-studio-border flex items-center justify-around px-2 safe-area-inset-bottom shrink-0 relative">
      {/* 顶部高光线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-studio-border-light/60 to-transparent" />

      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all relative ${
              isActive
                ? 'text-studio-accent'
                : 'text-studio-text-muted hover:text-studio-text-dim active:scale-95'
            }`}
          >
            {/* 激活态背景光晕 */}
            {isActive && (
              <div className="absolute inset-x-2 inset-y-1 rounded-xl bg-studio-accent/8 blur-md" />
            )}
            <div className="relative">
              <Icon
                size={20}
                strokeWidth={isActive ? 2.3 : 1.8}
                className={isActive ? 'drop-shadow-[0_0_6px_rgba(0,212,255,0.5)]' : ''}
              />
            </div>
            <span className={`relative text-[10px] font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
              {label}
            </span>
            {/* 活动指示条 — 渐变胶囊 */}
            {isActive && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-gradient-to-r from-studio-accent to-cyan-400 shadow-glow-sm" />
            )}
          </button>
        );
      })}
      {/* 多线程切换按钮 */}
      {onToggleBatch && (
        <button
          onClick={onToggleBatch}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all relative text-violet-400/70 hover:text-violet-300 active:scale-95"
        >
          <div className="relative">
            <Layers size={20} strokeWidth={1.8} />
          </div>
          <span className="relative text-[10px] font-medium tracking-wide">多线程</span>
        </button>
      )}
    </nav>
  );
}
