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
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { originalImageData, currentImageData } = useImageStore();

  // 渲染图像到显示 canvas（自适应容器尺寸）
  const renderImage = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    let imageDataToShow = currentImageData;
    if (compareMode === 'original') {
      imageDataToShow = originalImageData;
    }

    if (!imageDataToShow) {
      displayCanvas.width = 400;
      displayCanvas.height = 300;
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
      return;
    }

    // 显示 canvas 尺寸 = 容器尺寸（CSS 控制）
    const rect = displayCanvas.parentElement?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      displayCanvas.width = Math.floor(rect.width * window.devicePixelRatio);
      displayCanvas.height = Math.floor(rect.height * window.devicePixelRatio);
    } else {
      displayCanvas.width = imageDataToShow.width;
      displayCanvas.height = imageDataToShow.height;
    }

    // 绘制：保持宽高比，居中，适应容器
    ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    const imgW = imageDataToShow.width;
    const imgH = imageDataToShow.height;
    const cvsW = displayCanvas.width;
    const cvsH = displayCanvas.height;

    // contain 模式：等比缩放，完整显示
    const scale = Math.min(cvsW / imgW, cvsH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (cvsW - drawW) / 2;
    const offsetY = (cvsH - drawH) / 2;

    // 使用临时 canvas 缩放绘制
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = imgW;
    tmpCanvas.height = imgH;
    const tmpCtx = tmpCanvas.getContext('2d')!;
    tmpCtx.putImageData(imageDataToShow, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmpCanvas, offsetX, offsetY, drawW, drawH);
  }, [currentImageData, originalImageData, compareMode]);

  useEffect(() => {
    renderImage();

    // 容器尺寸变化时重新渲染（ResizeObserver）
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => renderImage());
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderImage]);

  // 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
  };

  // 拖拽平移开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // 拖拽平移中
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // 拖拽平移结束
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 空状态
  if (!originalImageData && !currentImageData) {
    return (
      <div className="w-full h-full min-h-[200px] rounded-lg border border-studio-border/50 bg-studio-bg/30 flex flex-col items-center justify-center gap-3">
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
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-studio-bg rounded-lg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Canvas 容器 — 自适应填充 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <div className="relative w-full h-full">
          <canvas
            ref={displayCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: zoom > 200 ? 'pixelated' : 'auto' }}
          />
        </div>
      </div>

      {/* 分屏对比模式下的滑块 */}
      {compareMode === 'split' && originalImageData && currentImageData && (
        <CompareSlider
          originalImageData={originalImageData}
          currentImageData={currentImageData}
          zoom={zoom}
          position={position}
        />
      )}

      {/* 缩放和位置指示器 */}
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
