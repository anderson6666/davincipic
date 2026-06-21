import { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, ZoomIn, Move } from 'lucide-react';
import { useImageStore } from '@/store/useImageStore';
import CompareSlider from './CompareSlider';

interface ImagePreviewProps {
  zoom: number;
  compareMode: 'original' | 'result' | 'split';
}

export default function ImagePreview({ zoom, compareMode }: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // 强制重渲染计数器（当 imageData 变化时递增，绕过 ResizeObserver 延迟）
  const [, setRenderTick] = useState(0);

  const { originalImageData, currentImageData } = useImageStore();

  // 获取容器实际尺寸（优先用 state，fallback 到 getBoundingClientRect）
  const getContainerSize = useCallback(() => {
    return new Promise<{ w: number; h: number }>((resolve) => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          resolve({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
          return;
        }
      }
      // fallback：requestAnimationFrame 等布局完成后再取
      requestAnimationFrame(() => {
        if (wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          resolve({ w: Math.max(Math.floor(rect.width), 300), h: Math.max(Math.floor(rect.height), 400) });
        } else {
          resolve({ w: 300, h: 400 });
        }
      });
    });
  }, []);

  // 渲染图像到 canvas
  const renderImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let imageDataToShow = currentImageData;
    if (compareMode === 'original') {
      imageDataToShow = originalImageData;
    }

    if (!imageDataToShow) {
      canvas.width = 300 * (window.devicePixelRatio || 1);
      canvas.height = 200 * (window.devicePixelRatio || 1);
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // 动态获取容器尺寸（确保不为 0）
    const { w: cw, h: ch } = await getContainerSize();
    const dpr = window.devicePixelRatio || 1;
    const cvsW = Math.max(Math.floor(cw * dpr), 100);
    const cvsH = Math.max(Math.floor(ch * dpr), 100);

    // 设置 canvas 物理像素
    if (canvas.width !== cvsW || canvas.height !== cvsH) {
      canvas.width = cvsW;
      canvas.height = cvsH;
    }

    ctx.clearRect(0, 0, cvsW, cvsH);

    // contain 模式：等比缩放居中
    const imgW = imageDataToShow.width;
    const imgH = imageDataToShow.height;
    const scale = Math.min(cvsW / imgW, cvsH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (cvsW - drawW) / 2;
    const offsetY = (cvsH - drawH) / 2;

    // ImageData → Canvas → drawImage（缩放桥接）
    const tmpCv = document.createElement('canvas');
    tmpCv.width = imgW;
    tmpCv.height = imgH;
    tmpCv.getContext('2d', { willReadFrequently: true })!.putImageData(imageDataToShow, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmpCv, offsetX, offsetY, drawW, drawH);
  }, [currentImageData, originalImageData, compareMode, getContainerSize]);

  // 当 imageData 或 compareMode 变化时强制重绘
  useEffect(() => {
    setRenderTick((t) => t + 1); // 触发状态更新确保组件重新执行
    renderImage();
  }, [currentImageData?.data, originalImageData?.data, compareMode]);

  // 容器尺寸变化时也重绘
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let rafId: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => renderImage());
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(rafId); };
  }, [renderImage]);

  // 触摸/鼠标事件（wheel 用 CSS touch-action: none 替代 preventDefault）
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 0 || e.pointerType === 'touch') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handlePointerUp = () => { setIsDragging(false); };

  // 空状态
  if (!originalImageData && !currentImageData) {
    return (
      <div className="w-full h-full min-h-[250px] rounded-lg border border-studio-border/50 bg-studio-bg/30 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-studio-surface/60 flex items-center justify-center">
          <Upload size={22} className="text-studio-text-muted/40" />
        </div>
        <p className="text-sm text-studio-text-dim/60">等待上传图片...</p>
        <p className="text-[11px] text-studio-text-muted/40">点击下方上传</p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full min-h-[300px] overflow-hidden bg-studio-bg rounded-lg"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      {/* 图像画布 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          imageRendering: zoom > 200 ? 'pixelated' : 'auto',
        }}
      />

      {/* 分屏对比 */}
      {compareMode === 'split' && originalImageData && currentImageData && (
        <CompareSlider
          originalImageData={originalImageData}
          currentImageData={currentImageData}
          zoom={zoom}
          position={position}
        />
      )}

      {/* 缩放指示器 */}
      <div className="absolute bottom-3 left-3 px-2 py-1 bg-studio-panel/90 backdrop-blur-sm rounded text-[10px] font-mono text-studio-text-dim flex items-center gap-2">
        <ZoomIn size={10} />
        {zoom}%
        <span className="mx-1">|</span>
        <Move size={10} />
        {Math.round(position.x)}, {Math.round(position.y)}
      </div>
    </div>
  );
}
