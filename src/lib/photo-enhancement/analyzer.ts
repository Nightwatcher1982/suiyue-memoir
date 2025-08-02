/**
 * 照片质量分析器
 * 用于检测照片质量问题并提供修复建议
 */

import type { PhotoIssue, PhotoEnhancementOptions } from '@/types';

export interface ImageAnalysisResult {
  qualityScore: number;
  issues: PhotoIssue[];
  recommendations: string[];
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * 分析图片质量
 */
export async function analyzePhotoQuality(imageFile: File | string): Promise<ImageAnalysisResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('图片分析只能在浏览器环境中使用');
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const issues: PhotoIssue[] = [];
        let qualityScore = 100;
        const recommendations: string[] = [];

        // 检测模糊度
        const blurScore = detectBlur(imageData);
        if (blurScore < 0.3) {
          issues.push({
            type: 'blur',
            severity: blurScore < 0.1 ? 'high' : blurScore < 0.2 ? 'medium' : 'low',
            description: '图片存在模糊问题',
            confidence: 1 - blurScore
          });
          qualityScore -= (1 - blurScore) * 30;
          recommendations.push('应用锐化滤镜提升清晰度');
        }

        // 检测噪点
        const noiseLevel = detectNoise(imageData);
        if (noiseLevel > 0.3) {
          issues.push({
            type: 'noise',
            severity: noiseLevel > 0.7 ? 'high' : noiseLevel > 0.5 ? 'medium' : 'low',
            description: '图片存在噪点',
            confidence: noiseLevel
          });
          qualityScore -= noiseLevel * 25;
          recommendations.push('使用降噪算法减少噪点');
        }

        // 检测分辨率
        const pixelCount = img.width * img.height;
        if (pixelCount < 500000) { // 少于50万像素
          issues.push({
            type: 'lowResolution',
            severity: pixelCount < 100000 ? 'high' : 'medium',
            description: '图片分辨率较低',
            confidence: 0.9
          });
          qualityScore -= 20;
          recommendations.push('考虑使用AI超分辨率技术放大图片');
        }

        // 检测对比度
        const contrastLevel = detectContrast(imageData);
        if (contrastLevel < 0.3) {
          issues.push({
            type: 'lowContrast',
            severity: contrastLevel < 0.1 ? 'high' : 'medium',
            description: '图片对比度不足',
            confidence: 1 - contrastLevel
          });
          qualityScore -= (1 - contrastLevel) * 20;
          recommendations.push('增强对比度以改善视觉效果');
        }

        // 检测曝光问题
        const exposureAnalysis = detectExposure(imageData);
        if (exposureAnalysis.overexposed > 0.1) {
          issues.push({
            type: 'overexposed',
            severity: exposureAnalysis.overexposed > 0.3 ? 'high' : 'medium',
            description: '图片存在过曝区域',
            confidence: exposureAnalysis.overexposed
          });
          qualityScore -= exposureAnalysis.overexposed * 15;
          recommendations.push('调整高光和阴影平衡');
        }

        if (exposureAnalysis.underexposed > 0.1) {
          issues.push({
            type: 'underexposed',
            severity: exposureAnalysis.underexposed > 0.3 ? 'high' : 'medium',
            description: '图片存在欠曝区域',
            confidence: exposureAnalysis.underexposed
          });
          qualityScore -= exposureAnalysis.underexposed * 15;
          recommendations.push('提亮暗部细节');
        }

        // 检测色偏
        const colorCast = detectColorCast(imageData);
        if (colorCast.strength > 0.3) {
          issues.push({
            type: 'colorCast',
            severity: colorCast.strength > 0.6 ? 'high' : 'medium',
            description: `图片存在${colorCast.type}色偏`,
            confidence: colorCast.strength
          });
          qualityScore -= colorCast.strength * 20;
          recommendations.push('进行白平衡校正');
        }

        resolve({
          qualityScore: Math.max(0, Math.min(100, qualityScore)),
          issues,
          recommendations,
          metadata: {
            width: img.width,
            height: img.height,
            format: imageFile instanceof File ? imageFile.type : 'unknown',
            size: imageFile instanceof File ? imageFile.size : 0
          }
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    
    if (imageFile instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    } else {
      img.src = imageFile;
    }
  });
}

/**
 * 检测图片模糊度
 */
function detectBlur(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let sharpness = 0;
  let count = 0;

  // 使用Sobel算子检测边缘
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // 获取灰度值
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      
      // 计算梯度
      const gx = getGrayscale(data, x + 1, y, width) - getGrayscale(data, x - 1, y, width);
      const gy = getGrayscale(data, x, y + 1, width) - getGrayscale(data, x, y - 1, width);
      
      const gradient = Math.sqrt(gx * gx + gy * gy);
      sharpness += gradient;
      count++;
    }
  }

  return Math.min(1, sharpness / count / 50); // 归一化到0-1
}

/**
 * 检测噪点
 */
function detectNoise(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let noise = 0;
  let count = 0;

  // 计算局部方差来检测噪点
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = getGrayscale(data, x, y, width);
      let variance = 0;
      let neighbors = 0;

      // 检查3x3邻域
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighbor = getGrayscale(data, x + dx, y + dy, width);
          variance += Math.pow(neighbor - center, 2);
          neighbors++;
        }
      }

      variance /= neighbors;
      noise += variance;
      count++;
    }
  }

  return Math.min(1, noise / count / 10000); // 归一化
}

/**
 * 检测对比度
 */
function detectContrast(imageData: ImageData): number {
  const { data } = imageData;
  const histogram = new Array(256).fill(0);

  // 构建灰度直方图
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    histogram[gray]++;
  }

  // 计算对比度
  let min = 0, max = 255;
  const total = imageData.width * imageData.height;
  const threshold = total * 0.01; // 忽略1%的极值

  let count = 0;
  for (let i = 0; i < 256; i++) {
    count += histogram[i];
    if (count > threshold) {
      min = i;
      break;
    }
  }

  count = 0;
  for (let i = 255; i >= 0; i--) {
    count += histogram[i];
    if (count > threshold) {
      max = i;
      break;
    }
  }

  return (max - min) / 255; // 归一化到0-1
}

/**
 * 检测曝光问题
 */
function detectExposure(imageData: ImageData): { overexposed: number; underexposed: number } {
  const { data } = imageData;
  let overexposed = 0;
  let underexposed = 0;
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    if (brightness > 240) overexposed++;
    if (brightness < 15) underexposed++;
  }

  return {
    overexposed: overexposed / total,
    underexposed: underexposed / total
  };
}

/**
 * 检测色偏
 */
function detectColorCast(imageData: ImageData): { type: string; strength: number } {
  const { data } = imageData;
  let rSum = 0, gSum = 0, bSum = 0;
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  const rAvg = rSum / total;
  const gAvg = gSum / total;
  const bAvg = bSum / total;

  const avg = (rAvg + gAvg + bAvg) / 3;
  const rDiff = Math.abs(rAvg - avg);
  const gDiff = Math.abs(gAvg - avg);
  const bDiff = Math.abs(bAvg - avg);

  const maxDiff = Math.max(rDiff, gDiff, bDiff);
  let type = '未知';

  if (maxDiff === rDiff) type = '红';
  else if (maxDiff === gDiff) type = '绿';
  else if (maxDiff === bDiff) type = '蓝';

  return {
    type,
    strength: maxDiff / 255
  };
}

/**
 * 获取指定位置的灰度值
 */
function getGrayscale(data: Uint8ClampedArray, x: number, y: number, width: number): number {
  const idx = (y * width + x) * 4;
  return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
}

/**
 * 根据分析结果生成推荐的修复选项
 */
export function generateRecommendedOptions(analysis: ImageAnalysisResult): PhotoEnhancementOptions {
  const issues = analysis.issues;
  const options: PhotoEnhancementOptions = {
    // 默认设置
    autoEnhance: true,
    denoising: false,
    sharpening: false,
    upscaling: false,
    colorCorrection: false,
    contrastEnhancement: false,
    brightnessAdjustment: false,
    saturationBoost: false,
    oldPhotoRestoration: false,
    scratchRemoval: false,
    colorization: false,
    faceEnhancement: false,
    outputFormat: 'original',
    outputQuality: 90
  };

  // 根据检测到的问题启用相应功能
  issues.forEach(issue => {
    switch (issue.type) {
      case 'blur':
        options.sharpening = true;
        break;
      case 'noise':
        options.denoising = true;
        break;
      case 'lowResolution':
        options.upscaling = true;
        break;
      case 'lowContrast':
        options.contrastEnhancement = true;
        break;
      case 'overexposed':
      case 'underexposed':
        options.brightnessAdjustment = true;
        break;
      case 'colorCast':
        options.colorCorrection = true;
        break;
    }
  });

  // 如果质量分数很低，启用老照片修复
  if (analysis.qualityScore < 40) {
    options.oldPhotoRestoration = true;
    options.scratchRemoval = true;
  }

  return options;
}