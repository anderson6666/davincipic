import { useEffect, useRef, useCallback } from 'react';
import { useImageStore } from '../store/useImageStore';
import { useNodeStore } from '../store/useNodeStore';
import { executeWorkflow } from '../engines/workflow/WorkflowEngine';

export function useRenderLoop() {
  const originalImageData = useImageStore(s => s.originalImageData);
  const setCurrentImageData = useImageStore(s => s.setCurrentImageData);
  const nodes = useNodeStore(s => s.nodes);
  const edges = useNodeStore((s: any) => s.edges) || useNodeStore(s => (s as any).edges);
  const renderTimeoutRef = useRef<number | null>(null);
  const isRenderingRef = useRef(false);

  const render = useCallback(() => {
    if (!originalImageData || isRenderingRef.current) return;

    // 防抖: 如果已有定时器则取消
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = window.setTimeout(() => {
      isRenderingRef.current = true;
      try {
        const result = executeWorkflow(originalImageData, nodes, edges as any);
        setCurrentImageData(result);
      } catch (err) {
        console.error('Render error:', err);
      } finally {
        isRenderingRef.current = false;
      }
    }, 50); // 50ms 防抖
  }, [originalImageData, nodes, edges, setCurrentImageData]);

  // 当 nodes 或 edges 变化时自动触发渲染
  useEffect(() => {
    render();

    // 清理定时器
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [render]);

  return { forceRender: render };
}

export default useRenderLoop;