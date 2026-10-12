export interface CompressionOptions {
  targetSizeKb?: number; // e.g. 48
  maxDimension?: number; // e.g. 1080
  initialQuality?: number; // e.g. 0.82
  minQuality?: number; // e.g. 0.45
  format?: 'image/jpeg' | 'image/webp';
}

export interface CompressionResult {
  dataUrl: string;
  base64: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  mimeType: string;
  ext: string;
  savedPercentage: number;
}

/**
 * Compresses an image client-side to target approximately 40-50 KB
 * while preserving high-definition visual quality for mobile screens.
 */
export async function compressImageToTarget(
  fileOrDataUrl: File | string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    targetSizeKb = 48,
    maxDimension = 1080,
    initialQuality = 0.82,
    minQuality = 0.45,
    format = 'image/jpeg',
  } = options;

  let originalDataUrl: string;
  let originalSizeKb = 0;

  if (typeof fileOrDataUrl === 'string') {
    originalDataUrl = fileOrDataUrl;
    // Estimate original size from base64
    const b64Part = originalDataUrl.split(',')[1] || originalDataUrl;
    originalSizeKb = Math.round((b64Part.length * 3) / 4 / 1024);
  } else {
    originalSizeKb = Math.round(fileOrDataUrl.size / 1024);
    originalDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  // Load into HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = originalDataUrl;
  });

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  // Calculate scaled dimensions to preserve HD sharpness
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Helper to render on canvas and return dataUrl and size
  const renderCanvas = (w: number, h: number, quality: number): { dataUrl: string; sizeKb: number; base64: string } => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    // Fill white background for clean transparency handling in JPEGs
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const outDataUrl = canvas.toDataURL(format, quality);
    const b64 = outDataUrl.split(',')[1] || '';
    const sizeKb = Math.round((b64.length * 3) / 4 / 1024);
    return { dataUrl: outDataUrl, sizeKb, base64: b64 };
  };

  // Iterative fine-tuning to land near targetSizeKb (40-55 KB)
  let bestAttempt = renderCanvas(targetWidth, targetHeight, initialQuality);
  let currentQuality = initialQuality;
  let currentW = targetWidth;
  let currentH = targetHeight;

  // If size is still larger than target + 7 KB, step down quality
  const targetThresholdMax = targetSizeKb + 8; // e.g. 56 KB max upper bound
  let iterations = 0;

  while (bestAttempt.sizeKb > targetThresholdMax && currentQuality > minQuality && iterations < 6) {
    iterations++;
    currentQuality = Math.max(minQuality, currentQuality - 0.08);
    const nextAttempt = renderCanvas(currentW, currentH, currentQuality);
    bestAttempt = nextAttempt;
    if (bestAttempt.sizeKb <= targetThresholdMax) break;
  }

  // If still too large (e.g. extremely noisy texture or photographic noise), slightly scale dimension
  if (bestAttempt.sizeKb > targetThresholdMax && (currentW > 720 || currentH > 720)) {
    const scaleFactor = 0.85;
    currentW = Math.round(currentW * scaleFactor);
    currentH = Math.round(currentH * scaleFactor);
    bestAttempt = renderCanvas(currentW, currentH, Math.max(0.70, currentQuality));
  }

  const finalExt = format === 'image/webp' ? 'webp' : 'jpg';
  const savedPercentage = originalSizeKb > 0
    ? Math.max(0, Math.min(99, Math.round((1 - bestAttempt.sizeKb / originalSizeKb) * 100)))
    : 0;

  return {
    dataUrl: bestAttempt.dataUrl,
    base64: bestAttempt.base64,
    originalSizeKb: originalSizeKb || bestAttempt.sizeKb,
    compressedSizeKb: bestAttempt.sizeKb,
    width: currentW,
    height: currentH,
    originalWidth,
    originalHeight,
    mimeType: format,
    ext: finalExt,
    savedPercentage,
  };
}
