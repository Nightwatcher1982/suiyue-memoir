'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { PhotoEnhancementOptions, PhotoIssue } from '@/types';
import type { ImageAnalysisResult } from '@/lib/photo-enhancement';

interface PhotoEnhancementPanelProps {
  analysis?: ImageAnalysisResult;
  options: PhotoEnhancementOptions;
  onOptionsChange: (options: PhotoEnhancementOptions) => void;
  onEnhance: () => void;
  loading?: boolean;
  className?: string;
}

export function PhotoEnhancementPanel({
  analysis,
  options,
  onOptionsChange,
  onEnhance,
  loading = false,
  className
}: PhotoEnhancementPanelProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'basic' | 'advanced' | 'output'>('analysis');

  const updateOption = <K extends keyof PhotoEnhancementOptions>(
    key: K,
    value: PhotoEnhancementOptions[K]
  ) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getIssueIcon = (type: PhotoIssue['type']) => {
    switch (type) {
      case 'blur':
        return '🔍';
      case 'noise':
        return '🌟';
      case 'lowResolution':
        return '📏';
      case 'lowContrast':
        return '🎨';
      case 'overexposed':
        return '☀️';
      case 'underexposed':
        return '🌙';
      case 'colorCast':
        return '🌈';
      case 'artifacts':
        return '⚠️';
      default:
        return '📸';
    }
  };

  const renderAnalysisTab = () => (
    <div className="space-y-4">
      {analysis ? (
        <>
          {/* 质量分数 */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-3">📊 质量评估</h4>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>总体质量</span>
                  <span className="font-medium">{Math.round(analysis.qualityScore)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      analysis.qualityScore >= 80 ? 'bg-green-500' :
                      analysis.qualityScore >= 60 ? 'bg-yellow-500' :
                      analysis.qualityScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    )}
                    style={{ width: `${analysis.qualityScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 检测到的问题 */}
          {analysis.issues.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3">🔍 检测到的问题</h4>
              <div className="space-y-2">
                {analysis.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border',
                      getSeverityColor(issue.severity)
                    )}
                  >
                    <span className="text-lg">{getIssueIcon(issue.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{issue.description}</p>
                      <p className="text-xs opacity-75">
                        严重程度: {issue.severity} • 置信度: {Math.round(issue.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 修复建议 */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3">💡 修复建议</h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 图片信息 */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-3">📋 图片信息</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">尺寸:</span>
                <span className="ml-2 font-medium">
                  {analysis.metadata.width} × {analysis.metadata.height}
                </span>
              </div>
              <div>
                <span className="text-gray-500">格式:</span>
                <span className="ml-2 font-medium">{analysis.metadata.format}</span>
              </div>
              <div>
                <span className="text-gray-500">文件大小:</span>
                <span className="ml-2 font-medium">
                  {(analysis.metadata.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="text-gray-500">像素:</span>
                <span className="ml-2 font-medium">
                  {((analysis.metadata.width * analysis.metadata.height) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>上传照片后将显示质量分析结果</p>
        </div>
      )}
    </div>
  );

  const renderBasicTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <h4 className="font-medium text-gray-900">🎯 基础增强</h4>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.autoEnhance}
            onChange={(e) => updateOption('autoEnhance', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">自动增强</span>
            <p className="text-xs text-gray-500">智能调整亮度、对比度和色彩平衡</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.sharpening}
            onChange={(e) => updateOption('sharpening', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">锐化处理</span>
            <p className="text-xs text-gray-500">增强图像边缘和细节清晰度</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.denoising}
            onChange={(e) => updateOption('denoising', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">降噪处理</span>
            <p className="text-xs text-gray-500">减少图像中的噪点和颗粒</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.upscaling}
            onChange={(e) => updateOption('upscaling', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">分辨率提升</span>
            <p className="text-xs text-gray-500">使用AI技术提高图像分辨率</p>
          </div>
        </label>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-4">
        <h4 className="font-medium text-gray-900">🎨 色彩调整</h4>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.colorCorrection}
            onChange={(e) => updateOption('colorCorrection', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">色彩校正</span>
            <p className="text-xs text-gray-500">自动白平衡和色彩偏移校正</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.contrastEnhancement}
            onChange={(e) => updateOption('contrastEnhancement', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">对比度增强</span>
            <p className="text-xs text-gray-500">提高图像的明暗对比</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.brightnessAdjustment}
            onChange={(e) => updateOption('brightnessAdjustment', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">亮度调整</span>
            <p className="text-xs text-gray-500">自动调整图像亮度</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.saturationBoost}
            onChange={(e) => updateOption('saturationBoost', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">饱和度增强</span>
            <p className="text-xs text-gray-500">让色彩更加鲜艳</p>
          </div>
        </label>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <h4 className="font-medium text-gray-900">🔬 高级功能</h4>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.oldPhotoRestoration}
            onChange={(e) => updateOption('oldPhotoRestoration', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">老照片修复</span>
            <p className="text-xs text-gray-500">修复老照片的泛黄、褪色等问题</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.scratchRemoval}
            onChange={(e) => updateOption('scratchRemoval', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">划痕去除</span>
            <p className="text-xs text-gray-500">自动检测并修复照片划痕</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.colorization}
            onChange={(e) => updateOption('colorization', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">黑白照片上色</span>
            <p className="text-xs text-gray-500">为黑白照片添加自然色彩</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.faceEnhancement}
            onChange={(e) => updateOption('faceEnhancement', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium">人脸增强</span>
            <p className="text-xs text-gray-500">专门优化人脸部分的清晰度</p>
          </div>
        </label>
      </div>

      {options.upscaling && (
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <h4 className="font-medium text-gray-900">📏 分辨率设置</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大宽度 (px)
              </label>
              <input
                type="number"
                value={options.maxWidth || ''}
                onChange={(e) => updateOption('maxWidth', parseInt(e.target.value) || undefined)}
                placeholder="自动"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大高度 (px)
              </label>
              <input
                type="number"
                value={options.maxHeight || ''}
                onChange={(e) => updateOption('maxHeight', parseInt(e.target.value) || undefined)}
                placeholder="自动"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOutputTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <h4 className="font-medium text-gray-900">💾 输出设置</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输出格式
          </label>
          <select
            value={options.outputFormat}
            onChange={(e) => updateOption('outputFormat', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="original">保持原格式</option>
            <option value="jpg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输出质量: {options.outputQuality}%
          </label>
          <input
            type="range"
            min="50"
            max="100"
            value={options.outputQuality}
            onChange={(e) => updateOption('outputQuality', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>压缩</span>
            <span>高质量</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('bg-gray-50 rounded-lg', className)}>
      {/* 选项卡 */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'analysis', label: '📊 分析', disabled: !analysis },
          { key: 'basic', label: '🎯 基础' },
          { key: 'advanced', label: '🔬 高级' },
          { key: 'output', label: '💾 输出' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && setActiveTab(tab.key as any)}
            disabled={tab.disabled}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
        {activeTab === 'output' && renderOutputTab()}
      </div>

      {/* 操作按钮 */}
      <div className="border-t border-gray-200 p-4">
        <Button
          onClick={onEnhance}
          disabled={loading}
          className="w-full"
          loading={loading}
        >
          {loading ? '修复中...' : '🚀 开始修复'}
        </Button>
      </div>
    </div>
  );
}