import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Undo2, Redo2, RotateCcw, Key, CheckCircle2, XCircle, Loader2, Layers, History, Download as DownloadIcon, Trash2, Sparkles } from 'lucide-react';
import { agnesClient, type APIConnectionStatus } from '../../api/client';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useSingleHistoryStore } from '../../store/useSingleHistoryStore';

interface HeaderProps {
  onUpload: () => void;
  onExport: (format: 'png' | 'jpeg') => void;
  onReset: () => void;
  isBatchMode?: boolean;
  onToggleBatchMode?: () => void;
}

/** API Key 设置弹窗 */
function APIKeySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(agnesClient.getApiKey());
  const [status, setStatus] = useState<APIConnectionStatus>(agnesClient.status);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    agnesClient.setApiKey(keyInput);

    let isValid = false;
    if (keyInput.trim()) {
      setStatus('validating');
      setErrorMsg('');

      const result = await agnesClient.validateConnection();
      isValid = result.valid;
      setStatus(isValid ? 'connected' : 'error');
      if (!isValid && result.error) {
        setErrorMsg(result.error);
      }
    } else {
      setStatus('no_key');
    }

    setTimeout(() => setIsOpen(false), isValid ? 1200 : 2500);
  };

  // 状态指示器颜色
  const statusColor = {
    idle: 'text-studio-text-muted',
    validating: 'text-studio-warning animate-pulse',
    connected: 'text-studio-success',
    error: 'text-red-400',
    no_key: 'text-studio-text-muted',
  };

  const StatusIcon = {
    idle: Key,
    validating: Loader2,
    connected: CheckCircle2,
    error: XCircle,
    no_key: Key,
  };

  const IconComp = StatusIcon[status];

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setKeyInput(agnesClient.getApiKey()); }}
        className={`w-9 h-9 rounded-lg bg-studio-surface border transition-all duration-200 flex items-center justify-center group ${
          status === 'connected'
            ? 'border-studio-success/40 hover:border-studio-success hover:shadow-[0_0_8px_rgba(74,222,128,0.25)]'
            : 'border-studio-border hover:border-studio-warning hover:shadow-glow-warning'
        }`}
        title={status === 'connected' ? `API 已连接` : '设置 Agnes AI API Key'}
      >
        <IconComp size={16} className={`${statusColor[status]} group-hover:scale-110 transition-all`} />
      </button>

      {/* 弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-14 pr-4" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
          <div className="bg-studio-panel border border-studio-border rounded-xl shadow-2xl p-5 w-80 space-y-4">
            <h3 className="font-mono text-sm text-studio-text font-semibold">Agnes AI 配置</h3>
            
            <div className="space-y-1.5">
              <label className="text-[11px] text-studio-text-dim font-mono uppercase tracking-wider">API Key</label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                autoFocus
                className="w-full px-3 py-2.5 bg-studio-bg border border-studio-border rounded-lg text-sm text-studio-text placeholder:text-studio-text-muted focus:outline-none focus:border-studio-accent focus:shadow-glow-sm transition-all font-mono"
              />
            </div>

            <p className="text-[10px] text-studio-text-muted">
              模型: agnes-2.0-flash
            </p>

            <a
              href="https://platform.agnes-ai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 text-center rounded-lg border border-studio-border bg-studio-surface text-xs text-studio-text-dim hover:text-studio-accent hover:border-studio-accent transition-all font-mono"
            >
              获取 API Key →
            </a>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-2">{errorMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={status === 'validating'}
                className="flex-1 py-2 bg-studio-accent text-black rounded-lg text-xs font-mono font-medium hover:bg-studio-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'validating' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    验证中...
                  </>
                ) : '保存并验证'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="py-2 px-4 bg-studio-surface border border-studio-border rounded-lg text-xs font-mono text-studio-text-dim hover:text-studio-text hover:border-studio-border-light transition-colors"
              >
                取消
              </button>
            </div>

            {status === 'connected' && (
              <p className="text-[11px] text-studio-success text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 size={12} /> API 连接成功，可以开始使用
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** 单张模式历史记录下拉 */
function SingleHistoryDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { entries, removeEntry, clearAll } = useSingleHistoryStore();
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const downloadImg = (dataUrl: string, name: string) => {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-lg bg-studio-surface border transition-all duration-200 flex items-center justify-center group relative ${
          isOpen ? 'border-studio-accent shadow-glow-sm' : 'border-studio-border hover:border-studio-accent/50'
        } ${entries.length > 0 ? '' : 'opacity-40'}`}
        title="历史记录"
      >
        <History size={16} className={`text-studio-text-dim group-hover:text-studio-accent transition-colors`} />
        {entries.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-studio-accent text-[8px] font-mono font-bold text-black flex items-center justify-center leading-none">
            {Math.min(entries.length, 9)}+
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={ref} className="fixed inset-0 z-50 flex items-start justify-end pt-14 pr-4" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
          <div className="bg-studio-panel border border-studio-border rounded-xl shadow-2xl w-80 max-h-[70vh] flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between p-3 border-b border-studio-border shrink-0">
              <div className="flex items-center gap-2">
                <History size={13} className="text-cyan-400" />
                <span className="text-xs font-mono text-white/70">单张模式历史</span>
                <span className="text-[9px] text-white/30">{entries.length}条</span>
              </div>
              {entries.length > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 px-2 py-0.5 text-[9px] rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-all"
                >
                  <Trash2 size={9} />清空
                </button>
              )}
            </div>

            {/* 列表 */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
              {entries.length === 0 ? (
                <div className="py-8 text-center">
                  <History size={24} className="text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/25">暂无历史</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id}
                    className="group/history flex gap-2 p-2 rounded-lg border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all"
                  >
                    {/* 缩略图 */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/[0.06] relative">
                      {entry.thumbnail ? (
                        <img src={entry.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
                          <DownloadIcon size={12} className="text-white/10" />
                        </div>
                      )}
                      {/* 下载覆盖 */}
                      {entry.resultImage && (
                        <div className="absolute inset-0 bg-black/0 group-hover/history:bg-black/60 flex items-center justify-center opacity-0 group-hover/history:opacity-100 transition-all cursor-pointer"
                          onClick={() => downloadImg(entry.resultImage!, `${entry.fileName}_调色成品.jpg`)}
                        >
                          <DownloadIcon size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    {/* 信息 */}
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="text-[10px] font-mono text-white/60 truncate">{entry.fileName}</p>
                      <p className="text-[8px] text-white/25 mt-0.5">
                        {entry.analysisResult?.sceneType ?? '-'} · {entry.commands?.length ?? 0}节点
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {entry.resultImage && (
                          <button onClick={() => downloadImg(entry.resultImage, `${entry.fileName}_调色成品.jpg`)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all"
                          >
                            <DownloadIcon size={8} />下载
                          </button>
                        )}
                        <button onClick={() => removeEntry(entry.id)}
                          className="ml-auto px-1.5 py-0.5 rounded text-[8px] text-white/15 hover:text-red-400/60 transition-all"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Header({ onUpload, onExport, onReset, isBatchMode = false, onToggleBatchMode }: HeaderProps) {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  return (
    <header className="h-12 glass-panel border-b border-studio-border flex items-center justify-between px-3 lg:px-5 shrink-0 z-20 top-highlight">
      {/* 左侧 Logo */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Logo 图标 — 渐变方块 */}
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
          <Sparkles size={15} className="relative text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h1 className="font-mono text-sm lg:text-base font-bold tracking-widest leading-none text-gradient-accent">
            DavinciPic
          </h1>
          <span className="text-[8px] lg:text-[9px] text-studio-text-muted -mt-0.5 tracking-[0.2em] uppercase hidden lg:inline">
            AI Color Grading
          </span>
        </div>

        {/* 模式切换标签 */}
        <div className="hidden lg:flex items-center gap-0.5 ml-3 bg-studio-surface/60 rounded-xl p-[3px] border border-studio-border relative overflow-hidden">
          {/* 始终存在的流动光效（选中时更亮） */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/8 via-violet-500/10 to-fuchsia-500/8 transition-opacity duration-300 ${isBatchMode ? 'opacity-100 animate-pulse' : 'opacity-60'}`} />
          <button
            onClick={onToggleBatchMode}
            className={`relative px-3 py-1 text-[10px] font-mono rounded-lg transition-all ${
              !isBatchMode
                ? 'bg-studio-bg text-studio-text shadow-sm'
                : 'text-studio-text-muted hover:text-studio-text-dim'
            }`}
          >
            单张模式
          </button>
          <button
            onClick={onToggleBatchMode}
            className={`relative px-3 py-1 text-[10px] font-mono rounded-lg transition-all flex items-center gap-1.5 ${
              isBatchMode
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.03] active:scale-[0.97]'
                : 'bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-cyan-300/70 font-medium shadow-sm shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:scale-[1.02] hover:text-cyan-300 active:scale-[0.98]'
            }`}
          >
            <Layers size={12} className={isBatchMode ? 'animate-pulse' : 'animate-pulse opacity-60'} />
            <span>多线程</span>
            {isBatchMode && (
              <span className="ml-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-white/80 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* 右侧工具按钮组 */}
      <div className="flex items-center gap-1 lg:gap-1.5">
        <button
          onClick={onUpload}
          className="w-9 h-9 rounded-lg bg-studio-surface/70 border border-studio-border hover:border-studio-accent hover:bg-studio-surface hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group"
          title="上传图片"
        >
          <Upload size={16} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        {/* 桌面端显示导出和撤销/重做 */}
        <button
          onClick={() => onExport('png')}
          className="w-8 h-8 rounded-md bg-studio-surface/70 border border-studio-border hover:border-studio-accent hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group hidden lg:flex"
          title="导出 PNG"
        >
          <Download size={15} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        <div className="w-px h-5 bg-gradient-to-b from-transparent via-studio-border-light to-transparent mx-0.5 hidden lg:block" />

        <button
          onClick={() => undo()}
          disabled={!canUndo()}
          className="w-8 h-8 rounded-md bg-studio-surface/70 border border-studio-border hover:border-studio-accent hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-studio-border hidden lg:flex"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 size={15} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        <button
          onClick={() => redo()}
          disabled={!canRedo()}
          className="w-8 h-8 rounded-md bg-studio-surface/70 border border-studio-border hover:border-studio-accent hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-studio-border hidden lg:flex"
          title="重做 (Ctrl+Y)"
        >
          <Redo2 size={15} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        <div className="w-px h-5 bg-gradient-to-b from-transparent via-studio-border-light to-transparent mx-0.5 hidden lg:block" />

        <button
          onClick={onReset}
          className="w-8 h-8 rounded-md bg-studio-surface/70 border border-studio-border hover:border-studio-warning hover:shadow-glow-warning transition-all duration-200 flex items-center justify-center group hidden lg:flex"
          title="重置所有"
        >
          <RotateCcw size={15} className="text-studio-text-dim group-hover:text-studio-warning transition-colors" />
        </button>

        <div className="w-px h-5 bg-gradient-to-b from-transparent via-studio-border-light to-transparent mx-0.5 hidden lg:block" />

        {/* API Key 设置按钮 - 始终显示 */}
        <APIKeySettings />

        {/* 单张模式历史记录 - 仅单张模式显示 */}
        {!isBatchMode && <SingleHistoryDropdown />}
      </div>
    </header>
  );
}
