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
    <nav className="lg:hidden h-14 bg-studio-panel/95 backdrop-blur-lg border-t border-studio-border flex items-center justify-around px-2 safe-area-inset-bottom shrink-0">
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-all relative ${
              isActive ? 'text-studio-accent' : 'text-studio-text-muted hover:text-studio-text-dim'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={`text-[10px] font-medium ${isActive ? '' : ''}`}>
              {label}
            </span>
            {/* 活动指示条 */}
            {isActive && (
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-studio-accent rounded-full" />
            )}
          </button>
        );
      })}
      {/* 多线程切换按钮 */}
      {onToggleBatch && (
        <button
          onClick={onToggleBatch}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-all relative text-violet-400/60 hover:text-violet-300"
        >
          <Layers size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">多线程</span>
        </button>
      )}
    </nav>
  );
}
