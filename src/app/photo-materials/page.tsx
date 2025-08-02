'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PhotoEnhancer } from '@/components/photo/PhotoEnhancer';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import type { PhotoEnhancementResult } from '@/types';

function PhotoMaterialsContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [enhancedPhotos, setEnhancedPhotos] = useState<Array<{
    id: string;
    originalUrl: string;
    enhancedUrl: string;
    result: PhotoEnhancementResult;
    timestamp: Date;
  }>>([]);

  const handlePhotoEnhanced = (originalUrl: string, enhancedUrl: string, result: PhotoEnhancementResult) => {
    const newPhoto = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      originalUrl,
      enhancedUrl,
      result,
      timestamp: new Date()
    };
    
    setEnhancedPhotos(prev => [newPhoto, ...prev]);
  };

  const downloadPhoto = (photo: typeof enhancedPhotos[0]) => {
    const link = document.createElement('a');
    link.href = photo.enhancedUrl;
    link.download = `enhanced_photo_${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removePhoto = (id: string) => {
    setEnhancedPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.originalUrl);
        URL.revokeObjectURL(photo.enhancedUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录后才能使用照片修复功能</p>
          <Button onClick={() => router.push('/')}>
            返回首页登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                size="sm"
              >
                ← 返回工作台
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                📸 照片素材采集与修复
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                你好，{user.nickname}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 左侧：照片修复区域 */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  ✨ AI照片修复工具
                </h2>
                <p className="text-sm text-gray-600">
                  上传您的珍贵照片，我们将使用AI技术自动检测问题并进行智能修复，
                  包括降噪、锐化、色彩校正、老照片修复等功能。
                </p>
              </div>
              
              <PhotoEnhancer onPhotoEnhanced={handlePhotoEnhanced} />
            </div>
          </div>

          {/* 右侧：修复历史 */}
          <div className="space-y-6">
            {/* 功能介绍 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🎨 修复功能</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">•</span>
                  <div>
                    <div className="font-medium">智能分析</div>
                    <div className="text-gray-500">自动检测照片质量问题</div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">•</span>
                  <div>
                    <div className="font-medium">基础增强</div>
                    <div className="text-gray-500">锐化、降噪、对比度调整</div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-500">•</span>
                  <div>
                    <div className="font-medium">色彩修复</div>
                    <div className="text-gray-500">白平衡、饱和度、亮度</div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500">•</span>
                  <div>
                    <div className="font-medium">老照片修复</div>
                    <div className="text-gray-500">去黄化、划痕修复、上色</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 修复历史 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">📋 修复历史</h3>
                {enhancedPhotos.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnhancedPhotos([])}
                  >
                    清空历史
                  </Button>
                )}
              </div>
              
              {enhancedPhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">暂无修复记录</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {enhancedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={photo.enhancedUrl}
                          alt="修复后"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                质量提升: +{photo.result.qualityScore.improvement.toFixed(1)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {photo.timestamp.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPhoto(photo)}
                                className="text-xs px-2 py-1"
                              >
                                下载
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removePhoto(photo.id)}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                              >
                                删除
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            {photo.result.improvements.slice(0, 2).map((improvement, index) => (
                              <span
                                key={index}
                                className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mr-1"
                              >
                                {improvement.type}
                              </span>
                            ))}
                            {photo.result.improvements.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{photo.result.improvements.length - 2} 项
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 使用提示 */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 使用提示</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 支持多种图片格式，最大50MB</li>
                <li>• 修复后的照片可直接插入回忆录</li>
                <li>• 建议先使用预设方案，再微调参数</li>
                <li>• 老照片建议选择"老照片修复"预设</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PhotoMaterialsPage() {
  return (
    <AuthProvider>
      <PhotoMaterialsContent />
    </AuthProvider>
  );
}