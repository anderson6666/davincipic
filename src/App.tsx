import { useState, useEffect, useCallback } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainPanel from './components/layout/MainPanel';
import BottomBar from './components/layout/BottomBar';
import MobileNav from './components/layout/MobileNav';
import RightPanel from './components/layout/RightPanel';
import { useImageLoader } from './hooks/useImageLoader';
import { useRenderLoop } from './hooks/useRenderLoop';
import { useExport } from './hooks/useExport';
import { useImageStore } from './store/useImageStore';
import { useNodeStore } from './store/useNodeStore';
import { useHistoryStore } from './store/useHistoryStore';

/** 移动端 Tab 类型 */
type MobileTab = 'preview' | 'nodes' | 'ai';

export default function App() {
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
  const { loadImage, triggerFileInput, fileInputRef } = useImageLoader();
  const { exportAsPNG, exportAsJPEG } = useExport();
  const { forceRender } = useRenderLoop(); // 关键：监听节点变化 → 触发渲染引擎

  // Stores
  const resetImage = useImageStore((s) => s.reset);
  const addNode = useNodeStore((s) => s.addNode);
  const clearAllNodes = useNodeStore((s) => s.clearAll);
  const pushHistory = useHistoryStore((s) => s.pushHistory);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  /**
   * 将 AI 返回的 commands 自动创建为节点，并按顺序串联 edges
   */
  const applyCommands = useCallback((
    commands: Array<{ nodeType: string; params: Record<string, any>; confidence: number; description: string }>,
    source: string,
  ) => {
    if (commands.length === 0) return;

    const nodeIds: string[] = [];
    let appliedCount = 0;

    for (const cmd of commands) {
      if (cmd.nodeType && cmd.confidence > 0.15) {
        const id = addNode(cmd.nodeType as any, undefined, cmd.params);
        nodeIds.push(id);
        appliedCount++;
      }
    }

    // 按顺序串联节点 edges（确保 workflow 引擎按正确顺序执行）
    const { connectNodes } = useNodeStore.getState();
    for (let i = 0; i < nodeIds.length - 1; i++) {
      connectNodes(nodeIds[i], nodeIds[i + 1]);
    }

    if (appliedCount > 0) {
      // 显式触发一次渲染（确保 workflow 引擎立即执行）
      setTimeout(() => {
        forceRender();
        pushHistory(
          useNodeStore.getState().nodes,
          useNodeStore.getState().edges,
          source,
        );
      }, 150);
    }

    console.log(`[AutoGrade] 自动应用了 ${appliedCount} 个调色节点 (${source})`);
  }, [addNode, pushHistory, forceRender]);

  /**
   * 图片上传 → AI 自动分析+决策 → 自动应用节点（通用处理）
   */
  const processImage = useCallback(async (file: File) => {
    try {
      const result = await loadImage(file);

      if (result.commands && result.commands.length > 0) {
        applyCommands(result.commands, `AI自动调色 (${result.commands.length}个节点)`);
      }
      // 移动端上传后自动切到 AI 面板查看结果
      setMobileTab('ai');
    } catch (err) {
      console.error('[App] 图片上传错误:', err);
    }
  }, [loadImage, applyCommands]);

  /**
   * 文件 input change 处理
   */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    await processImage(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processImage, fileInputRef]);

  /**
   * 拖拽文件处理
   */
  const handleFileDrop = useCallback(async (file: File) => {
    await processImage(file);
  }, [processImage]);

  // 导出
  const handleExport = useCallback((format: 'png' | 'jpeg') => {
    format === 'png' ? exportAsPNG(1.0) : exportAsJPEG(0.92);
  }, [exportAsPNG, exportAsJPEG]);

  // 重置
  const handleReset = useCallback(() => {
    resetImage();
    clearAllNodes();
  }, [resetImage, clearAllNodes]);

  // 快捷键（仅桌面端）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="w-full h-full flex flex-col bg-studio-bg overflow-hidden">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <Header onUpload={triggerFileInput} onExport={handleExport} onReset={handleReset} />

      {/* ===== 桌面端布局 (lg+: ≥1024px) ===== */}
      <div className="flex-1 flex overflow-hidden hidden lg:flex">
        <Sidebar />
        <MainPanel onUpload={triggerFileInput} onFileDrop={handleFileDrop} />
        <RightPanel />
      </div>
      <BottomBar className="hidden lg:flex" />

      {/* ===== 移动端布局 (< lg: <1024px) ===== */}
      <div className="flex-1 overflow-hidden lg:hidden min-h-0">
        {mobileTab === 'preview' && <div className="w-full h-full"><Sidebar mobile /></div>}
        {mobileTab === 'nodes' && <div className="w-full h-full"><RightPanel mobile /></div>}
        {mobileTab === 'ai' && <div className="w-full h-full"><MainPanel onUpload={triggerFileInput} onFileDrop={handleFileDrop} mobile /></div>}
      </div>

      {/* 移动端底部导航 — 仅移动端显示 */}
      <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} />
    </div>
  );
}
