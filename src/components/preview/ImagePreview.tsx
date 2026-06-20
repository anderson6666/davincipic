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
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { originalImageData, currentImageData } = useImageStore();

  // 渲染图像到 canvas
  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 根据 compareMode 选择要显示的 imageData
    let imageDataToShow = currentImageData;
    if (compareMode === 'original') {
      imageDataToShow = originalImageData;
    }

    if (!imageDataToShow) {
      canvas.width = 400;
      canvas.height = 300;
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    canvas.width = imageDataToShow.width;
    canvas.height = imageDataToShow.height;
    ctx.putImageData(imageDataToShow, 0, 0);
  }, [currentImageData, originalImageData, compareMode]);

  useEffect(() => {
    renderImage();
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

  // 空状态：等待上传（不可点击，引导用户去右侧上传）
  if (!originalImageData && !currentImageData) {
    return (
      <div className="w-full h-full min-h-[300px] rounded-lg border border-studio-border/50 bg-studio-bg/30 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-studio-surface/60 flex items-center justify-center">
          <Upload size={22} className="text-studio-text-muted/40" />
        </div>
        <p className="text-sm text-studio-text-dim/60">等待上传图片...</p>
        <p className="text-[11px] text-studio-text-muted/40">请在右侧面板上传</p>
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
      {/* Canvas 容器 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full shadow-lg"
          style={{ imageRendering: zoom > 200 ? 'pixelated' : 'auto' }}
        />
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
