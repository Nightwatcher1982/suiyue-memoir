'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoUploadModal } from '@/components/photos/PhotoUploadModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import type { Photo } from '@/types';

interface PhotoUploadEnhancedProps {
  onPhotoUpload: (imageUrl: string, file: File) => void;
  projectId?: string;
  chapterId?: string;
  className?: string;
}

export function PhotoUploadEnhanced({ 
  onPhotoUpload, 
  projectId, 
  chapterId, 
  className 
}: PhotoUploadEnhancedProps) {
  const { user } = useAuth();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPendingFile(file);
      setShowPhotoModal(true);
    }
  }, []);

  const handlePhotoUploaded = (photo: Photo) => {
    // 将照片插入到编辑器中
    onPhotoUpload(photo.url, new File([], photo.name));
    
    // 关闭模态框并清理状态
    setShowPhotoModal(false);
    setPendingFile(null);
  };

  const handleModalClose = () => {
    setShowPhotoModal(false);
    setPendingFile(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  if (!user) {
    return (
      <div className={cn('p-4 bg-gray-50 rounded-lg text-center', className)}>
        <p className="text-sm text-gray-600">请登录后上传照片</p>
      </div>
    );
  }

  return (
    <>
      {/* 拖拽上传区域 */}
      <div className={cn('space-y-4', className)}>
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">📸</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? '拖拽照片到这里上传'
                  : '拖拽照片到这里，或点击选择文件'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                照片将自动保存到照片档案中，并插入到编辑器
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 照片上传模态框 */}
      {pendingFile && (
        <PhotoUploadModal
          isOpen={showPhotoModal}
          onClose={handleModalClose}
          onPhotoUploaded={handlePhotoUploaded}
          projectId={projectId}
          chapterId={chapterId}
          defaultName={pendingFile.name.replace(/\.[^/.]+$/, '')} // 去掉扩展名
        />
      )}
    </>
  );
}