import { useCallback } from 'react';
import { useImageStore } from '../store/useImageStore';

export function useExport() {
  const currentImageData = useImageStore(s => s.currentImageData);
  const fileName = useImageStore(s => s.fileName);

  const exportAsPNG = useCallback((quality: number = 1.0) => {
    if (!currentImageData) return;

    // 1. 创建 canvas
    const canvas = document.createElement('canvas');
    canvas.width = currentImageData.width;
    canvas.height = currentImageData.height;
    const ctx = canvas.getContext('2d')!;

    // 2. 放入 currentImageData
    ctx.putImageData(currentImageData, 0, 0);

    // 3. toBlob('image/png', quality)
    canvas.toBlob((blob) => {
      if (!blob) return;

      // 4. 创建下载链接并触发下载
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 5. 文件名格式: originalName_graded.png
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      link.download = `${baseName}_graded.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png', quality);
  }, [currentImageData, fileName]);

  const exportAsJPEG = useCallback((quality: number = 0.92) => {
    if (!currentImageData) return;

    // 同上但 format 为 image/jpeg
    const canvas = document.createElement('canvas');
    canvas.width = currentImageData.width;
    canvas.height = currentImageData.height;
    const ctx = canvas.getContext('2d')!;

    ctx.putImageData(currentImageData, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const baseName = fileName.replace(/\.[^/.]+$/, '');
      link.download = `${baseName}_graded.jpg`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/jpeg', quality);
  }, [currentImageData, fileName]);

  const copyToClipboard = useCallback(async () => {
    if (!currentImageData) return;

    // Canvas -> blob -> navigator.clipboard.write()
    const canvas = document.createElement('canvas');
    canvas.width = currentImageData.width;
    canvas.height = currentImageData.height;
    const ctx = canvas.getContext('2d')!;

    ctx.putImageData(currentImageData, 0, 0);

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return;

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
    }
  }, [currentImageData]);

  return { exportAsPNG, exportAsJPEG, copyToClipboard };
}

export default useExport;