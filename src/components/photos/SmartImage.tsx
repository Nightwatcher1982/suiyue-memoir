'use client';

import React, { useState } from 'react';
import type { Photo } from '@/types';

interface SmartImageProps {
  photo: Photo;
  alt?: string;
  className?: string;
  onUrlRefreshed?: (newUrl: string) => void;
}

export function SmartImage({ 
  photo, 
  alt, 
  className,
  onUrlRefreshed 
}: SmartImageProps) {
  const [currentUrl, setCurrentUrl] = useState(photo.url);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageError = async () => {
    if (isRefreshing || hasError || !photo.fileId) {
      setHasError(true);
      return;
    }

    setIsRefreshing(true);
    
    try {
      console.log('🔄 图片加载失败，尝试刷新URL:', photo.name);
      
      const { storageService } = await import('@/lib/cloudbase/storage');
      const newUrl = await storageService.getDownloadUrl(photo.fileId);
      
      setCurrentUrl(newUrl);
      setHasError(false);
      onUrlRefreshed?.(newUrl);
      
      console.log('✅ 图片URL已刷新:', photo.name);
    } catch (error) {
      console.error('❌ 刷新图片URL失败:', error);
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImageLoad = () => {
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 p-4">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">图片加载失败</div>
          <div className="text-xs text-gray-400 mt-1">{photo.name}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={currentUrl}
        alt={alt || photo.name}
        className={className}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {isRefreshing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-sm">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
            刷新中...
          </div>
        </div>
      )}
    </div>
  );
}