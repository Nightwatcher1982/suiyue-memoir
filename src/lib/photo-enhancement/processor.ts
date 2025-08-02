/**
 * 照片修复处理器
 * 使用Canvas API和图像处理算法来修复照片
 */

import type { PhotoEnhancementOptions, PhotoEnhancementResult } from '@/types';

export class PhotoProcessor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    // 延迟初始化，只在浏览器环境中创建Canvas
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }
      this.ctx = ctx;
    }
  }

  private ensureCanvasInitialized(): void {
    if (!this.canvas || !this.ctx) {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('PhotoProcessor只能在浏览器环境中使用');
      }
      this.canvas = document.createElement('canvas');
      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }
      this.ctx = ctx;
    }
  }

  /**
   * 处理照片修复
   */
  async enhancePhoto(
    imageFile: File | string,
    options: PhotoEnhancementOptions
  ): Promise<PhotoEnhancementResult> {
    this.ensureCanvasInitialized();
    const startTime = Date.now();

    try {
      const originalImage = await this.loadImage(imageFile);
      const beforeQuality = await this.assessImageQuality(originalImage);

      // 设置画布尺寸
      this.canvas!.width = originalImage.width;
      this.canvas!.height = originalImage.height;
      this.ctx!.drawImage(originalImage, 0, 0);

      const improvements: Array<{
        type: string;
        description: string;
        beforeAfterComparison?: { before: string; after: string };
      }> = [];

      // 应用各种修复算法
      if (options.autoEnhance) {
        await this.applyAutoEnhancement();
        improvements.push({
          type: 'autoEnhance',
          description: '自动增强图像整体质量'
        });
      }

      if (options.denoising) {
        await this.applyDenoising();
        improvements.push({
          type: 'denoising',
          description: '减少图像噪点'
        });
      }

      if (options.sharpening) {
        await this.applySharpening();
        improvements.push({
          type: 'sharpening',
          description: '增强图像锐度和清晰度'
        });
      }

      if (options.colorCorrection) {
        await this.applyColorCorrection();
        improvements.push({
          type: 'colorCorrection',
          description: '校正色彩平衡'
        });
      }

      if (options.contrastEnhancement) {
        await this.applyContrastEnhancement();
        improvements.push({
          type: 'contrastEnhancement',
          description: '增强图像对比度'
        });
      }

      if (options.brightnessAdjustment) {
        await this.applyBrightnessAdjustment();
        improvements.push({
          type: 'brightnessAdjustment',
          description: '调整图像亮度'
        });
      }

      if (options.saturationBoost) {
        await this.applySaturationBoost();
        improvements.push({
          type: 'saturationBoost',
          description: '增强色彩饱和度'
        });
      }

      if (options.oldPhotoRestoration) {
        await this.applyOldPhotoRestoration();
        improvements.push({
          type: 'oldPhotoRestoration',
          description: '修复老照片的常见问题'
        });
      }

      if (options.upscaling && options.maxWidth && options.maxHeight) {
        await this.applyUpscaling(options.maxWidth, options.maxHeight);
        improvements.push({
          type: 'upscaling',
          description: '提升图像分辨率'
        });
      }

      // 生成最终图像
      const enhancedUrl = this.canvas?.toDataURL(
        this.getOutputMimeType(options.outputFormat),
        options.outputQuality / 100
      ) || '';

      // 生成缩略图
      const thumbnail = await this.generateThumbnail(200, 200);

      // 评估修复后的质量
      const afterQuality = await this.assessCanvasQuality();
      const processingTime = (Date.now() - startTime) / 1000;

      return {
        success: true,
        enhancedUrl,
        thumbnail,
        improvements,
        processingTime,
        qualityScore: {
          before: beforeQuality,
          after: afterQuality,
          improvement: afterQuality - beforeQuality
        }
      };
    } catch (error) {
      return {
        success: false,
        improvements: [],
        processingTime: (Date.now() - startTime) / 1000,
        qualityScore: {
          before: 0,
          after: 0,
          improvement: 0
        },
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 加载图像
   */
  private loadImage(source: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图像加载失败'));

      if (source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(source);
      } else {
        img.src = source;
      }
    });
  }

  /**
   * 自动增强
   */
  private async applyAutoEnhancement(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // 计算直方图
    const histogram = this.calculateHistogram(data);
    
    // 自动调整对比度和亮度
    const { min, max } = this.findHistogramRange(histogram);
    const range = max - min;
    
    if (range > 0) {
      for (let i = 0; i < data.length; i += 4) {
        // 对每个颜色通道应用线性拉伸
        data[i] = Math.min(255, Math.max(0, ((data[i] - min) * 255) / range));
        data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - min) * 255) / range));
        data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - min) * 255) / range));
      }
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 降噪处理
   */
  private async applyDenoising(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 高斯模糊降噪
    const blurredData = this.applyGaussianBlur(data, width, height, 1);
    
    // 将处理后的数据写回
    for (let i = 0; i < data.length; i++) {
      data[i] = blurredData[i];
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 锐化处理
   */
  private async applySharpening(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 锐化核
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    const sharpenedData = this.applyConvolution(data, width, height, kernel, 3);
    
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.min(255, Math.max(0, sharpenedData[i]));
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 色彩校正
   */
  private async applyColorCorrection(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // 计算平均色彩
    let rSum = 0, gSum = 0, bSum = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }

    const rAvg = rSum / pixelCount;
    const gAvg = gSum / pixelCount;
    const bAvg = bSum / pixelCount;
    const totalAvg = (rAvg + gAvg + bAvg) / 3;

    // 校正色偏
    const rFactor = totalAvg / rAvg;
    const gFactor = totalAvg / gAvg;
    const bFactor = totalAvg / bAvg;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * rFactor);
      data[i + 1] = Math.min(255, data[i + 1] * gFactor);
      data[i + 2] = Math.min(255, data[i + 2] * bFactor);
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 对比度增强
   */
  private async applyContrastEnhancement(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    const factor = 1.2; // 对比度增强因子

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * factor) + 128));
      data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * factor) + 128));
      data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * factor) + 128));
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 亮度调整
   */
  private async applyBrightnessAdjustment(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // 计算自动亮度调整值
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    brightness /= (data.length / 4);

    const adjustment = brightness < 128 ? 20 : -10; // 暗图提亮，亮图稍微降低

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 饱和度增强
   */
  private async applySaturationBoost(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    const saturationFactor = 1.2;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 转换到HSL
      const [h, s, l] = this.rgbToHsl(r, g, b);
      
      // 增强饱和度
      const newS = Math.min(1, s * saturationFactor);
      
      // 转换回RGB
      const [newR, newG, newB] = this.hslToRgb(h, newS, l);
      
      data[i] = newR;
      data[i + 1] = newG;
      data[i + 2] = newB;
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 老照片修复
   */
  private async applyOldPhotoRestoration(): Promise<void> {
    if (!this.ctx || !this.canvas) return;
    // 综合应用多种修复技术
    await this.applyDenoising();
    await this.applyColorCorrection();
    await this.applyContrastEnhancement();
    
    // 特殊的老照片色调调整
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // 减少黄化效果
    for (let i = 0; i < data.length; i += 4) {
      // 减少黄色色调
      if (data[i] > data[i + 2] && data[i + 1] > data[i + 2]) {
        data[i] = Math.max(data[i] - 10, 0);
        data[i + 1] = Math.max(data[i + 1] - 5, 0);
      }
    }

    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * 图像放大
   */
  private async applyUpscaling(maxWidth: number, maxHeight: number): Promise<void> {
    if (!this.canvas) {
      throw new Error('Canvas未初始化');
    }
    
    const currentWidth = this.canvas.width;
    const currentHeight = this.canvas.height;

    // 计算缩放比例
    const scaleX = maxWidth / currentWidth;
    const scaleY = maxHeight / currentHeight;
    const scale = Math.min(scaleX, scaleY, 2); // 最大放大2倍

    if (scale > 1) {
      const newWidth = Math.round(currentWidth * scale);
      const newHeight = Math.round(currentHeight * scale);

      // 创建临时画布
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;

      // 使用bicubic插值进行高质量缩放
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(this.canvas, 0, 0, newWidth, newHeight);

      // 更新主画布
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas或上下文未初始化');
      }
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(width: number, height: number): Promise<string> {
    if (!this.canvas) {
      throw new Error('Canvas未初始化');
    }
    
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d')!;
    
    const scale = Math.min(width / this.canvas.width, height / this.canvas.height);
    const scaledWidth = this.canvas.width * scale;
    const scaledHeight = this.canvas.height * scale;
    
    thumbnailCanvas.width = scaledWidth;
    thumbnailCanvas.height = scaledHeight;
    
    thumbnailCtx.imageSmoothingEnabled = true;
    thumbnailCtx.imageSmoothingQuality = 'high';
    thumbnailCtx.drawImage(this.canvas, 0, 0, scaledWidth, scaledHeight);
    
    return thumbnailCanvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * 辅助方法：计算直方图
   */
  private calculateHistogram(data: Uint8ClampedArray): number[] {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      histogram[gray]++;
    }
    return histogram;
  }

  /**
   * 辅助方法：查找直方图范围
   */
  private findHistogramRange(histogram: number[]): { min: number; max: number } {
    const total = histogram.reduce((sum, count) => sum + count, 0);
    const threshold = total * 0.01;

    let min = 0;
    let count = 0;
    for (let i = 0; i < 256; i++) {
      count += histogram[i];
      if (count > threshold) {
        min = i;
        break;
      }
    }

    count = 0;
    let max = 255;
    for (let i = 255; i >= 0; i--) {
      count += histogram[i];
      if (count > threshold) {
        max = i;
        break;
      }
    }

    return { min, max };
  }

  /**
   * 辅助方法：高斯模糊
   */
  private applyGaussianBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length);
    const kernel = this.generateGaussianKernel(radius);
    const kernelSize = kernel.length;
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let totalWeight = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelY = y + ky - halfKernel;
            const pixelX = x + kx - halfKernel;

            if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const weight = kernel[ky * kernelSize + kx];

              r += data[pixelIndex] * weight;
              g += data[pixelIndex + 1] * weight;
              b += data[pixelIndex + 2] * weight;
              a += data[pixelIndex + 3] * weight;
              totalWeight += weight;
            }
          }
        }

        const outputIndex = (y * width + x) * 4;
        result[outputIndex] = r / totalWeight;
        result[outputIndex + 1] = g / totalWeight;
        result[outputIndex + 2] = b / totalWeight;
        result[outputIndex + 3] = a / totalWeight;
      }
    }

    return result;
  }

  /**
   * 辅助方法：生成高斯核
   */
  private generateGaussianKernel(radius: number): number[] {
    const size = radius * 2 + 1;
    const kernel = new Array(size * size);
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;
    let sum = 0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const distance = (x - radius) * (x - radius) + (y - radius) * (y - radius);
        const value = Math.exp(-distance / twoSigmaSquare);
        kernel[y * size + x] = value;
        sum += value;
      }
    }

    // 归一化
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  /**
   * 辅助方法：应用卷积
   */
  private applyConvolution(data: Uint8ClampedArray, width: number, height: number, kernel: number[], kernelSize: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelY = y + ky - halfKernel;
            const pixelX = x + kx - halfKernel;

            if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const weight = kernel[ky * kernelSize + kx];

              r += data[pixelIndex] * weight;
              g += data[pixelIndex + 1] * weight;
              b += data[pixelIndex + 2] * weight;
            }
          }
        }

        const outputIndex = (y * width + x) * 4;
        result[outputIndex] = r;
        result[outputIndex + 1] = g;
        result[outputIndex + 2] = b;
        result[outputIndex + 3] = data[outputIndex + 3]; // 保持alpha通道
      }
    }

    return result;
  }

  /**
   * 辅助方法：RGB转HSL
   */
  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    if (diff === 0) {
      return [0, 0, l];
    }

    const s = l > 0.5 ? diff / (2 - sum) : diff / sum;

    let h: number;
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
      default:
        h = 0;
    }

    return [h, s, l];
  }

  /**
   * 辅助方法：HSL转RGB
   */
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    if (s === 0) {
      const gray = Math.round(l * 255);
      return [gray, gray, gray];
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const r = hue2rgb(p, q, h + 1/3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1/3);

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * 辅助方法：评估图像质量
   */
  private async assessImageQuality(img: HTMLImageElement): Promise<number> {
    // 简化的质量评估，基于对比度、清晰度等
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);

    return this.assessCanvasQuality();
  }

  /**
   * 辅助方法：评估画布质量
   */
  private async assessCanvasQuality(): Promise<number> {
    if (!this.ctx || !this.canvas) {
      return 0.5;
    }
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // 计算对比度
    const histogram = this.calculateHistogram(data);
    const { min, max } = this.findHistogramRange(histogram);
    const contrast = (max - min) / 255;

    // 计算清晰度（简化版）
    let sharpness = 0;
    for (let i = 4; i < data.length - 4; i += 4) {
      const diff = Math.abs(data[i] - data[i - 4]) + 
                   Math.abs(data[i + 1] - data[i - 3]) + 
                   Math.abs(data[i + 2] - data[i - 2]);
      sharpness += diff;
    }
    sharpness = Math.min(1, sharpness / (data.length / 4) / 100);

    // 综合评分
    return Math.round((contrast * 50 + sharpness * 30 + 20)); // 基础分20
  }

  /**
   * 获取输出MIME类型
   */
  private getOutputMimeType(format: string): string {
    switch (format) {
      case 'jpg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}