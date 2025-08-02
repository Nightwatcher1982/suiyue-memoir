'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  onPhotoUpload: (imageUrl: string, file: File) => void;
  className?: string;
}

export function PhotoUpload({ onPhotoUpload, className }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    url: string;
    name: string;
    size: number;
  }>>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        // 模拟上传到云存储的过程
        // TODO: 集成CloudBase云存储
        const imageUrl = URL.createObjectURL(file);
        
        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const uploadedImage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url: imageUrl,
          name: file.name,
          size: file.size,
        };
        
        setUploadedImages(prev => [...prev, uploadedImage]);
        onPhotoUpload(imageUrl, file);
      }
    } catch (error) {
      console.error('照片上传失败:', error);
      alert('照片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  }, [onPhotoUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const insertImageToEditor = (imageUrl: string) => {
    onPhotoUpload(imageUrl, new File([], 'existing-image'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        
        <div className="space-y-2">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          {isUploading ? (
            <div>
              <p className="text-sm text-gray-600">上传中...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? '拖拽照片到这里上传'
                  : '拖拽照片到这里，或点击选择文件'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                支持 JPG、PNG、GIF、WebP 格式，最大 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 已上传图片列表 */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">已上传的照片</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                
                {/* 悬停操作按钮 */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => insertImageToEditor(image.url)}
                    className="text-xs py-1 px-2"
                  >
                    插入
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeImage(image.id)}
                    className="text-xs py-1 px-2 bg-white text-gray-700 hover:bg-gray-100"
                  >
                    删除
                  </Button>
                </div>
                
                {/* 文件信息 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-1">
                  <p className="text-xs truncate">{image.name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(image.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-3">
        <Button
          variant="outline"
          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          disabled={isUploading}
          size="sm"
        >
          📁 选择文件
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const url = prompt('请输入图片URL:');
            if (url) {
              insertImageToEditor(url);
            }
          }}
          size="sm"
        >
          🔗 URL链接
        </Button>
      </div>
    </div>
  );
} 