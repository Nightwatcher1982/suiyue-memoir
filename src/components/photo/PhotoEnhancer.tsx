'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { PhotoEnhancementPanel } from './PhotoEnhancementPanel';
import { cn } from '@/lib/utils';
import { photoEnhancementService } from '@/lib/photo-enhancement';
import type { PhotoEnhancementOptions, PhotoEnhancementResult } from '@/types';
import type { ImageAnalysisResult } from '@/lib/photo-enhancement';

interface PhotoEnhancerProps {
  onPhotoEnhanced?: (originalUrl: string, enhancedUrl: string, result: PhotoEnhancementResult) => void;
  className?: string;
}

export function PhotoEnhancer({ onPhotoEnhanced, className }: PhotoEnhancerProps) {
  const [originalImage, setOriginalImage] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult>();
  const [enhancementOptions, setEnhancementOptions] = useState<PhotoEnhancementOptions>({
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
  });
  const [enhancedResult, setEnhancedResult] = useState<PhotoEnhancementResult>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'sideBySide' | 'slider'>('sideBySide');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const url = URL.createObjectURL(file);
      
      setOriginalImage({ file, url });
      setEnhancedResult(undefined);
      setShowComparison(false);
      
      // 自动分析照片
      await analyzePhoto(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const analyzePhoto = async (file: File) => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const result = await photoEnhancementService.analyzePhoto(file);
      setAnalysis(result);
      
      // 生成推荐设置
      const recommendations = photoEnhancementService.generateRecommendations(result);
      setEnhancementOptions(recommendations);
    } catch (error) {
      console.error('照片分析失败:', error);
      alert('照片分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enhancePhoto = async () => {
    if (!originalImage) return;

    setIsEnhancing(true);
    try {
      const result = await photoEnhancementService.enhancePhoto(
        originalImage.file,
        enhancementOptions
      );
      
      if (result.success) {
        setEnhancedResult(result);
        setShowComparison(true);
        onPhotoEnhanced?.(originalImage.url, result.enhancedUrl!, result);
      } else {
        alert(`照片修复失败: ${result.error}`);
      }
    } catch (error) {
      console.error('照片修复失败:', error);
      alert('照片修复失败，请重试');
    } finally {
      setIsEnhancing(false);
    }
  };

  const downloadEnhancedImage = () => {
    if (!enhancedResult?.enhancedUrl) return;
    
    const link = document.createElement('a');
    link.href = enhancedResult.enhancedUrl;
    link.download = `enhanced_${originalImage?.file.name || 'photo'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    if (originalImage?.url) {
      URL.revokeObjectURL(originalImage.url);
    }
    setOriginalImage(null);
    setAnalysis(undefined);
    setEnhancedResult(undefined);
    setShowComparison(false);
    setEnhancementOptions({
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
    });
  };

  const applyPreset = (preset: 'basic' | 'advanced' | 'oldPhoto' | 'portrait') => {
    const presetOptions = photoEnhancementService.getPresetOptions(preset);
    setEnhancementOptions(presetOptions);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 上传区域 */}
      {!originalImage ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                上传照片开始修复
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isDragActive
                  ? '拖拽照片到这里上传'
                  : '拖拽照片到这里，或点击选择文件'}
              </p>
              <p className="text-xs text-gray-400">
                支持 JPG、PNG、GIF、WebP、BMP、TIFF 格式，最大 50MB
              </p>
            </div>
            
            <Button variant="outline">
              📁 选择照片
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：图片预览和操作 */}
          <div className="space-y-4">
            {/* 预设快捷按钮 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium text-gray-900 mb-3">🎯 快捷预设</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('basic')}
                  className="text-left"
                >
                  <div className="text-xs">
                    <div className="font-medium">基础增强</div>
                    <div className="text-gray-500">日常照片</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('advanced')}
                  className="text-left"
                >
                  <div className="text-xs">
                    <div className="font-medium">高级修复</div>
                    <div className="text-gray-500">质量较差</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('oldPhoto')}
                  className="text-left"
                >
                  <div className="text-xs">
                    <div className="font-medium">老照片</div>
                    <div className="text-gray-500">泛黄褪色</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('portrait')}
                  className="text-left"
                >
                  <div className="text-xs">
                    <div className="font-medium">人物照</div>
                    <div className="text-gray-500">人脸优化</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* 图片预览 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              {!showComparison ? (
                <div className="relative">
                  <img
                    src={originalImage.url}
                    alt="原图"
                    className="w-full h-auto"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    原图
                  </div>
                </div>
              ) : enhancedResult?.enhancedUrl && (
                <div className="space-y-2">
                  {/* 对比模式切换 */}
                  <div className="flex justify-center p-2 border-b">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setComparisonMode('sideBySide')}
                        className={cn(
                          'px-3 py-1 text-xs rounded-md transition-colors',
                          comparisonMode === 'sideBySide'
                            ? 'bg-white shadow-sm'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        并排对比
                      </button>
                      <button
                        onClick={() => setComparisonMode('slider')}
                        className={cn(
                          'px-3 py-1 text-xs rounded-md transition-colors',
                          comparisonMode === 'slider'
                            ? 'bg-white shadow-sm'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        滑块对比
                      </button>
                    </div>
                  </div>

                  {comparisonMode === 'sideBySide' ? (
                    <div className="grid grid-cols-2 gap-1">
                      <div className="relative">
                        <img
                          src={originalImage.url}
                          alt="原图"
                          className="w-full h-auto"
                          style={{ maxHeight: '300px', objectFit: 'contain' }}
                        />
                        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          修复前
                        </div>
                      </div>
                      <div className="relative">
                        <img
                          src={enhancedResult.enhancedUrl}
                          alt="修复后"
                          className="w-full h-auto"
                          style={{ maxHeight: '300px', objectFit: 'contain' }}
                        />
                        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          修复后
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden">
                      <img
                        src={originalImage.url}
                        alt="原图"
                        className="w-full h-auto"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                      <div className="absolute inset-0">
                        <img
                          src={enhancedResult.enhancedUrl}
                          alt="修复后"
                          className="w-full h-auto"
                          style={{ 
                            maxHeight: '400px', 
                            objectFit: 'contain',
                            clipPath: 'inset(0 50% 0 0)'
                          }}
                        />
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-full bg-white shadow-lg" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 修复结果信息 */}
            {enhancedResult && (
              <div className="bg-white rounded-lg border p-4 space-y-3">
                <h4 className="font-medium text-gray-900">📈 修复结果</h4>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {enhancedResult.qualityScore.after}
                    </div>
                    <div className="text-gray-500">修复后质量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      +{enhancedResult.qualityScore.improvement.toFixed(1)}
                    </div>
                    <div className="text-gray-500">质量提升</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {enhancedResult.processingTime.toFixed(1)}s
                    </div>
                    <div className="text-gray-500">处理时间</div>
                  </div>
                </div>

                {enhancedResult.improvements.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">应用的改进:</h5>
                    <ul className="space-y-1">
                      {enhancedResult.improvements.map((improvement, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          <span>{improvement.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              {enhancedResult ? (
                <>
                  <Button onClick={downloadEnhancedImage} className="flex-1">
                    💾 下载修复后照片
                  </Button>
                  <Button variant="outline" onClick={resetAll}>
                    🔄 重新开始
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={resetAll} className="flex-1">
                    🔄 重新选择
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    📁 添加更多
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 右侧：设置面板 */}
          <div>
            <PhotoEnhancementPanel
              analysis={analysis}
              options={enhancementOptions}
              onOptionsChange={setEnhancementOptions}
              onEnhance={enhancePhoto}
              loading={isAnalyzing || isEnhancing}
            />
          </div>
        </div>
      )}

      {/* 分析中状态 */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">正在分析照片质量...</p>
          </div>
        </div>
      )}
    </div>
  );
}