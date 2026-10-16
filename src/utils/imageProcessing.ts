import { EnhancementSettings } from '../types';

export const DEFAULT_SETTINGS: EnhancementSettings = {
  deblurSharpen: 65,
  faceDetailBoost: 60,
  denoiseGrain: 25,
  claheContrast: 40,
  scratchSuppression: 35,
  colorVibrance: 30,
  sepiaNeutralize: false,
  whiteBalance: 0,
  exposure: 4,
  upscaleFactor: 2,
};

export const PRESETS = [
  {
    id: 'crystal-clear',
    title: 'Crystal Clear',
    subtitle: 'Balanced unblur, edge definition & HD clarity',
    icon: 'Sparkles',
    badge: 'Popular',
    settings: {
      deblurSharpen: 75,
      faceDetailBoost: 65,
      denoiseGrain: 25,
      claheContrast: 45,
      scratchSuppression: 30,
      colorVibrance: 35,
      sepiaNeutralize: false,
      whiteBalance: 0,
      exposure: 5,
      upscaleFactor: 2 as const,
    },
  },
  {
    id: 'face-portrait-hd',
    title: 'Portrait & Face Focus',
    subtitle: 'Sharpens eyes, hair, lips & smooths skin grain',
    icon: 'UserCheck',
    badge: 'Best for Faces',
    settings: {
      deblurSharpen: 85,
      faceDetailBoost: 90,
      denoiseGrain: 40,
      claheContrast: 50,
      scratchSuppression: 45,
      colorVibrance: 40,
      sepiaNeutralize: false,
      whiteBalance: 2,
      exposure: 6,
      upscaleFactor: 2 as const,
    },
  },
  {
    id: 'scratch-dust-eraser',
    title: 'Scratch & Crease Eraser',
    subtitle: 'Suppresses paper cracks, dust specks & tears',
    icon: 'Wand2',
    badge: 'Restoration',
    settings: {
      deblurSharpen: 55,
      faceDetailBoost: 45,
      denoiseGrain: 50,
      claheContrast: 40,
      scratchSuppression: 85,
      colorVibrance: 25,
      sepiaNeutralize: false,
      whiteBalance: 0,
      exposure: 2,
      upscaleFactor: 1 as const,
    },
  },
  {
    id: 'vintage-color-rebirth',
    title: 'Vintage Rejuvenator',
    subtitle: 'Neutralizes yellow patina & restores lost colors',
    icon: 'Palette',
    badge: 'Colorize',
    settings: {
      deblurSharpen: 65,
      faceDetailBoost: 55,
      denoiseGrain: 30,
      claheContrast: 50,
      scratchSuppression: 35,
      colorVibrance: 65,
      sepiaNeutralize: true,
      whiteBalance: -5,
      exposure: 8,
      upscaleFactor: 2 as const,
    },
  },
  {
    id: 'crisp-archival-bw',
    title: 'Archival Monochrome',
    subtitle: 'Rich silver-gelatin deep black & razor edges',
    icon: 'Film',
    badge: 'Classic B&W',
    settings: {
      deblurSharpen: 80,
      faceDetailBoost: 75,
      denoiseGrain: 20,
      claheContrast: 65,
      scratchSuppression: 40,
      colorVibrance: 0,
      sepiaNeutralize: true,
      whiteBalance: 0,
      exposure: 5,
      upscaleFactor: 2 as const,
    },
  },
  {
    id: 'deep-shadow-revival',
    title: 'Shadow & Detail Recovery',
    subtitle: 'Reveals hidden details in dark, underexposed areas',
    icon: 'SunMedium',
    badge: 'Low Light',
    settings: {
      deblurSharpen: 60,
      faceDetailBoost: 50,
      denoiseGrain: 35,
      claheContrast: 75,
      scratchSuppression: 30,
      colorVibrance: 30,
      sepiaNeutralize: false,
      whiteBalance: 0,
      exposure: 18,
      upscaleFactor: 2 as const,
    },
  },
];

/**
 * High performance photo restoration pipeline executing on Canvas/ImageData
 */
export async function enhancePhoto(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  settings: EnhancementSettings,
  inpaintCanvasMask?: HTMLCanvasElement | null
): Promise<string> {
  const originalWidth = sourceImage instanceof HTMLImageElement ? sourceImage.naturalWidth : sourceImage.width;
  const originalHeight = sourceImage instanceof HTMLImageElement ? sourceImage.naturalHeight : sourceImage.height;

  // Determine working resolution based on upscale factor
  const scale = settings.upscaleFactor;
  // Bound max dimension to avoid browser canvas memory crashes while ensuring extreme sharpness
  const maxDim = 2800;
  let targetWidth = originalWidth * scale;
  let targetHeight = originalHeight * scale;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Step 1: Draw high-quality scaled source
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

  // Step 1.5: If manual inpaint mask exists, heal those regions first
  if (inpaintCanvasMask) {
    applyInpaintMask(ctx, inpaintCanvasMask, targetWidth, targetHeight);
  }

  // Get raw pixel buffer
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const w = targetWidth;
  const h = targetHeight;

  // Parameters
  const sharpenAmount = (settings.deblurSharpen / 100) * 1.8 + (settings.faceDetailBoost / 100) * 1.2;
  const denoiseStrength = settings.denoiseGrain / 100;
  const claheAmount = settings.claheContrast / 100;
  const scratchStrength = settings.scratchSuppression / 100;
  const vibranceAmount = settings.colorVibrance / 100;
  const sepiaFix = settings.sepiaNeutralize;
  const exposureMul = 1 + (settings.exposure / 100) * 0.8;
  const wbShift = (settings.whiteBalance / 100) * 30;

  // Fast scratch & speckle suppression pass (morphological outlier filter)
  if (scratchStrength > 0.15) {
    suppressScratches(data, w, h, scratchStrength);
  }

  // Fast Bilateral / Edge-preserving smoothing buffer for denoise & high-pass unsharp mask
  // Create a smoothed luminance copy
  const smoothedLum = new Float32Array(w * h);
  computeSmoothedLuminance(data, smoothedLum, w, h, denoiseStrength);

  // Compute average luminance & min/max for dynamic range expansion (CLAHE-like)
  let sumLum = 0;
  const totalPixels = w * h;
  for (let i = 0; i < totalPixels; i++) {
    sumLum += smoothedLum[i];
  }
  const avgLum = sumLum / totalPixels;

  // Main restoration loop: Deblur Unsharp Mask + Tone Recovery + Color Rebuilding
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Current luminance
      const origLum = 0.299 * r + 0.587 * g + 0.114 * b;
      const smoothL = smoothedLum[y * w + x];

      // --- 1. Deblur & Face Detail Unsharp Mask ---
      // High-pass difference: origLum - smoothL
      const highPass = origLum - smoothL;

      // Deadband threshold: don't amplify tiny flat noise, boost real edges
      let edgeBoost = highPass;
      const deadband = 2.5;
      if (Math.abs(highPass) < deadband) {
        edgeBoost = highPass * (Math.abs(highPass) / deadband);
      }

      // Adaptive sharpening: boost edges more in midtones (facial details, eyes, hair)
      const midtoneWeight = 1.0 - Math.pow(Math.abs(origLum - 128) / 128, 1.8) * 0.4;
      const sharpLum = origLum + edgeBoost * sharpenAmount * midtoneWeight;

      // Apply luminance delta to RGB channels
      const lumDelta = sharpLum - origLum;
      r += lumDelta;
      g += lumDelta;
      b += lumDelta;

      // --- 2. Adaptive Contrast & Shadow Recovery (CLAHE simulation) ---
      if (claheAmount > 0.05) {
        // Shadow lift & highlight compression curve
        const normL = Math.max(0, Math.min(255, sharpLum)) / 255;
        // S-curve contrast with shadow recovery
        const contrastFactor = 1.0 + claheAmount * 0.7;
        let enhancedL = (normL - 0.5) * contrastFactor + 0.5;
        // Shadow recovery: pull out hidden detail in dark vintage areas
        if (normL < 0.45) {
          const shadowBoost = (0.45 - normL) * claheAmount * 0.5;
          enhancedL += shadowBoost;
        }
        enhancedL = Math.max(0, Math.min(1, enhancedL)) * 255;
        const claheDelta = (enhancedL - sharpLum) * 0.8;
        r += claheDelta;
        g += claheDelta;
        b += claheDelta;
      }

      // --- 3. Exposure adjustment ---
      r *= exposureMul;
      g *= exposureMul;
      b *= exposureMul;

      // --- 4. White Balance Adjustment ---
      r += wbShift;
      b -= wbShift;

      // --- 5. Sepia Neutralization & Vintage Color Correction ---
      if (sepiaFix) {
        // Sepia has heavily elevated red and reduced blue
        // Balance toward natural color or clean archival tone
        const currentL = 0.299 * r + 0.587 * g + 0.114 * b;
        const colorDiffR = r - currentL;
        const colorDiffB = b - currentL;

        // If it fits sepia profile (red > luminance, blue < luminance)
        if (colorDiffR > 0 && colorDiffB < 0) {
          r = currentL + colorDiffR * 0.25;
          b = currentL + colorDiffB * 0.25;
          g = currentL + (g - currentL) * 0.25;
        }
      }

      // --- 6. Color Vibrance & Rejuvenation ---
      if (vibranceAmount > 0.05) {
        const curL = 0.299 * r + 0.587 * g + 0.114 * b;
        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const sat = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;

        // Vibrance boosts desaturated colors more than already-saturated ones
        const vibranceBoost = (1.0 - sat) * vibranceAmount * 1.3;
        r = curL + (r - curL) * (1.0 + vibranceBoost);
        g = curL + (g - curL) * (1.0 + vibranceBoost);
        b = curL + (b - curL) * (1.0 + vibranceBoost);
      }

      // Clamp output
      data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.94);
}

/**
 * Fast edge-preserving box/bilateral luminance filter for noise & high-pass reference
 */
function computeSmoothedLuminance(
  data: Uint8ClampedArray,
  outLum: Float32Array,
  w: number,
  h: number,
  denoiseStrength: number
) {
  // Precompute luminance
  const rawLum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    rawLum[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const radius = denoiseStrength > 0.5 ? 2 : 1;
  const edgeThreshold = 18 + (1 - denoiseStrength) * 25;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const centerIdx = y * w + x;
      const centerL = rawLum[centerIdx];

      let weightSum = 0;
      let valSum = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;

          const neighborL = rawLum[ny * w + nx];
          const diff = Math.abs(neighborL - centerL);

          // Bilateral range weighting: ignore pixels across sharp edges
          if (diff < edgeThreshold) {
            const weight = 1.0 / (1.0 + (dx * dx + dy * dy) * 0.5);
            valSum += neighborL * weight;
            weightSum += weight;
          }
        }
      }

      outLum[centerIdx] = weightSum > 0 ? valSum / weightSum : centerL;
    }
  }
}

/**
 * Auto-detect and suppress fine scratch streaks and dust specks
 */
function suppressScratches(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  strength: number
) {
  const threshold = 55 - strength * 25; // Lower threshold = detects more scratches
  const copy = new Uint8ClampedArray(data);

  // Sample stride to keep fast 60fps responsiveness
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = (y * w + x) * 4;
      const lum = (copy[idx] + copy[idx + 1] + copy[idx + 2]) / 3;

      // Check vertical & horizontal outlier contrast (scratches are typically thin 1-2px streaks)
      const topLum = (copy[((y - 2) * w + x) * 4] + copy[((y - 2) * w + x) * 4 + 1] + copy[((y - 2) * w + x) * 4 + 2]) / 3;
      const botLum = (copy[((y + 2) * w + x) * 4] + copy[((y + 2) * w + x) * 4 + 1] + copy[((y + 2) * w + x) * 4 + 2]) / 3;
      const leftLum = (copy[(y * w + (x - 2)) * 4] + copy[(y * w + (x - 2)) * 4 + 1] + copy[(y * w + (x - 2)) * 4 + 2]) / 3;
      const rightLum = (copy[(y * w + (x + 2)) * 4] + copy[(y * w + (x + 2)) * 4 + 1] + copy[(y * w + (x + 2)) * 4 + 2]) / 3;

      const vertAvg = (topLum + botLum) / 2;
      const horizAvg = (leftLum + rightLum) / 2;

      // If this pixel is significantly brighter or darker than its orthogonal neighbors (scratch signature)
      const isVertScratch = Math.abs(lum - horizAvg) > threshold && Math.abs(topLum - botLum) < 20;
      const isHorizScratch = Math.abs(lum - vertAvg) > threshold && Math.abs(leftLum - rightLum) < 20;

      if (isVertScratch || isHorizScratch) {
        const blendWeight = Math.min(0.85, strength * 0.9);
        const targetR = isVertScratch
          ? (copy[(y * w + (x - 1)) * 4] + copy[(y * w + (x + 1)) * 4]) / 2
          : (copy[((y - 1) * w + x) * 4] + copy[((y + 1) * w + x) * 4]) / 2;
        const targetG = isVertScratch
          ? (copy[(y * w + (x - 1)) * 4 + 1] + copy[(y * w + (x + 1)) * 4 + 1]) / 2
          : (copy[((y - 1) * w + x) * 4 + 1] + copy[((y + 1) * w + x) * 4 + 1]) / 2;
        const targetB = isVertScratch
          ? (copy[(y * w + (x - 1)) * 4 + 2] + copy[(y * w + (x + 1)) * 4 + 2]) / 2
          : (copy[((y - 1) * w + x) * 4 + 2] + copy[((y + 1) * w + x) * 4 + 2]) / 2;

        data[idx] = data[idx] * (1 - blendWeight) + targetR * blendWeight;
        data[idx + 1] = data[idx + 1] * (1 - blendWeight) + targetG * blendWeight;
        data[idx + 2] = data[idx + 2] * (1 - blendWeight) + targetB * blendWeight;
      }
    }
  }
}

/**
 * Interactive Inpaint Mask (Magic Eraser tool for user-drawn scratches or tears)
 */
function applyInpaintMask(
  ctx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  w: number,
  h: number
) {
  // Read mask
  const mCanvas = document.createElement('canvas');
  mCanvas.width = w;
  mCanvas.height = h;
  const mCtx = mCanvas.getContext('2d');
  if (!mCtx) return;
  mCtx.drawImage(maskCanvas, 0, 0, w, h);

  const maskData = mCtx.getImageData(0, 0, w, h).data;
  const targetData = ctx.getImageData(0, 0, w, h);
  const data = targetData.data;

  // Multi-pass patch synthesis for masked pixels
  const patchRadius = 4;
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        // Mask pixel has alpha > 20
        if (maskData[idx + 3] > 20) {
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let count = 0;

          for (let dy = -patchRadius; dy <= patchRadius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) continue;
            for (let dx = -patchRadius; dx <= patchRadius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= w) continue;
              const nIdx = (ny * w + nx) * 4;
              // Only pull colors from unmasked pixels
              if (maskData[nIdx + 3] <= 20) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                const weight = 1 / (1 + dist);
                rSum += data[nIdx] * weight;
                gSum += data[nIdx + 1] * weight;
                bSum += data[nIdx + 2] * weight;
                count += weight;
              }
            }
          }

          if (count > 0) {
            data[idx] = Math.round(rSum / count);
            data[idx + 1] = Math.round(gSum / count);
            data[idx + 2] = Math.round(bSum / count);
          }
        }
      }
    }
  }

  ctx.putImageData(targetData, 0, 0);
}
