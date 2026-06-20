import { useRef, useState, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface CompareSliderProps {
  originalImageData: ImageData;
  currentImageData: ImageData;
  zoom: number;
  position: { x: number; y: number };
}

export default function CompareSlider({
  originalImageData,
  currentImageData,
  zoom,
  position,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50); // 默认在中间 (0-100)
  const [isDragging, setIsDragging] = useState(false);

  // 计算滑块的实际位置
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      updateSliderPosition(e);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      updateSliderPosition(e);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateSliderPosition = (e: React.MouseEvent | MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'col-resize' : 'col-resize' }}
    >
      {/* 原图层（左侧） */}
      <div
        className="absolute top-0 bottom-0 overflow-hidden"
        style={{
          left: 0,
          width: `${sliderPosition}%`,
        }}
      >
        <canvas
          ref={(canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = originalImageData.width;
            canvas.height = originalImageData.height;
            ctx.putImageData(originalImageData, 0, 0);
          }}
          className="absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
            transformOrigin: 'center center',
            maxWidth: 'none',
            maxHeight: 'none',
          }}
        />
      </div>

      {/* 效果图层（右侧） */}
      <div
        className="absolute top-0 bottom-0 overflow-hidden"
        style={{
          right: 0,
          width: `${100 - sliderPosition}%`,
        }}
      >
        <canvas
          ref={(canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = currentImageData.width;
            canvas.height = currentImageData.height;
            ctx.putImageData(currentImageData, 0, 0);
          }}
          className="absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
            transformOrigin: 'center center',
            maxWidth: 'none',
            maxHeight: 'none',
          }}
        />
      </div>

      {/* 分割线 */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-studio-accent shadow-glow-accent z-10"
        style={{ left: `${sliderPosition}%` }}
      />

      {/* 分割线手柄 */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20"
        style={{ left: `${sliderPosition}%`, marginLeft: '-18px' }}
      >
        <div className="w-9 h-9 rounded-full bg-studio-panel border-2 border-studio-accent flex items-center justify-center shadow-glow-accent">
          <ArrowLeftRight size={16} className="text-studio-accent" />
        </div>
      </div>

      {/* 标签提示 */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-[10px] font-mono text-white">
        原图
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-[10px] font-mono text-white">
        效果
      </div>
    </div>
  );
}
