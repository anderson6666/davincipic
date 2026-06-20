import { useState, useRef } from 'react';
import { Upload, Download, Undo2, Redo2, RotateCcw, Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { agnesClient, type APIConnectionStatus } from '../../api/client';
import { useImageStore } from '../../store/useImageStore';
import { useHistoryStore } from '../../store/useHistoryStore';

interface HeaderProps {
  onUpload: () => void;
  onExport: (format: 'png' | 'jpeg') => void;
  onReset: () => void;
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
              模型: agnes-2.0-flash | API 地址: https://apihub.agnes-ai.com/v1
            </p>

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

export default function Header({ onUpload, onExport, onReset }: HeaderProps) {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  return (
    <header className="h-12 glass-panel border-b border-studio-border flex items-center justify-between px-4 shrink-0 z-20">
      {/* 左侧 Logo */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="font-mono text-base font-bold text-studio-accent tracking-widest drop-shadow-[0_0_10px_rgba(0,212,255,0.45)] leading-none">
            AGNES
          </h1>
          <span className="text-[9px] text-studio-text-dim -mt-0.5 tracking-widest uppercase">
            AI Color Studio
          </span>
        </div>
      </div>

      {/* 右侧工具按钮组 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onUpload}
          className="w-8 h-8 rounded-md bg-studio-surface border border-studio-border hover:border-studio-accent hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group"
          title="上传图片"
        >
          <Upload size={15} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        <button
          onClick={() => onExport('png')}
          className="w-8 h-8 rounded-md bg-studio-surface border border-studio-border hover:border-studio-accent hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group"
          title="导出 PNG"
        >
          <Download size={15} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        <div className="w-px h-5 bg-studio-border mx-0.5" />

        <button
          onClick={() => undo()}
          disabled={!canUndo()}
          className="w-8 h-8 rounded-md bg-studio-surface border border-studio-border hover:border-studio-accent hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-studio-border"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 size={15} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        <button
          onClick={() => redo()}
          disabled={!canRedo()}
          className="w-8 h-8 rounded-md bg-studio-surface border border-studio-border hover:border-studio-accent hover:shadow-glow-sm transition-all duration-200 flex items-center justify-center group disabled:opacity-30 disabled:hover:shadow-none disabled:hover:border-studio-border"
          title="重做 (Ctrl+Y)"
        >
          <Redo2 size={15} className="text-studio-text-dim group-hover:text-studio-accent transition-colors" />
        </button>

        <div className="w-px h-5 bg-studio-border mx-0.5" />

        <button
          onClick={onReset}
          className="w-8 h-8 rounded-md bg-studio-surface border border-studio-border hover:border-studio-warning hover:shadow-glow-warning transition-all duration-200 flex items-center justify-center group"
          title="重置所有"
        >
          <RotateCcw size={15} className="text-studio-text-dim group-hover:text-studio-warning transition-colors" />
        </button>

        <div className="w-px h-5 bg-studio-border mx-0.5" />

        {/* API Key 设置按钮 */}
        <APIKeySettings />
      </div>
    </header>
  );
}
