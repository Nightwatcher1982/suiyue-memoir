'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { generateId } from '@/lib/utils';
import type { Photo } from '@/types';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadedPhoto?: Photo;
}

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosUploaded: (photos: Photo[]) => void;
  userId?: string;
}

export function BatchUploadModal({ isOpen, onClose, onPhotosUploaded, userId }: BatchUploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 全局设置状态
  const [globalSettings, setGlobalSettings] = useState({
    location: '',
    relatedPeople: [] as string[],
    tags: [] as string[],
    applyToAll: false,
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newUploadFiles: UploadFile[] = [];
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = generateId();
        const preview = URL.createObjectURL(file);
        
        newUploadFiles.push({
          id,
          file,
          preview,
          name: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
          status: 'pending',
          progress: 0,
        });
      }
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileName = (id: string, name: string) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === id ? { ...f, name } : f
    ));
  };

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<Photo | null> => {
    try {
      // 更新状态为上传中
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      // 检查用户ID
      if (!userId) {
        throw new Error('用户未登录');
      }

      // 动态导入存储服务
      const { storageService } = await import('@/lib/cloudbase/storage');
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => {
          if (f.id === uploadFile.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);

      // 使用uploadPhoto方法上传文件
      const uploadResult = await storageService.uploadPhoto(
        uploadFile.file,
        userId,
        undefined // chapterId
      );
      
      clearInterval(progressInterval);

      // uploadPhoto返回的结构已经包含downloadUrl
      const downloadUrl = uploadResult.downloadUrl;

      // 创建照片数据
      const photoData = {
        name: uploadFile.name,
        description: '',
        url: downloadUrl,
        fileId: uploadResult.fileId,
        storageUrl: downloadUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadFile.file.type,
        location: globalSettings.applyToAll ? globalSettings.location : undefined,
        relatedPeople: globalSettings.applyToAll && globalSettings.relatedPeople.length > 0 ? globalSettings.relatedPeople : undefined,
        tags: globalSettings.applyToAll && globalSettings.tags.length > 0 ? globalSettings.tags : undefined,
        photographyDate: undefined, // 用户稍后可以编辑
        userId: userId,
        uploadedAt: new Date(),
      };

      // 保存到数据库
      const { databaseService } = await import('@/lib/cloudbase/database');
      const photoId = await databaseService.createPhoto(photoData);

      const newPhoto: Photo = {
        ...photoData,
        id: photoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 更新状态为成功
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'success', 
          progress: 100,
          uploadedPhoto: newPhoto 
        } : f
      ));

      return newPhoto;
    } catch (error) {
      console.error('上传照片失败:', error);
      
      // 更新状态为失败
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : '上传失败'
        } : f
      ));

      return null;
    }
  };

  const startBatchUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    const uploadedPhotos: Photo[] = [];

    // 并发上传，但限制并发数量
    const concurrentLimit = 3;
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending' || f.status === 'error');
    
    for (let i = 0; i < pendingFiles.length; i += concurrentLimit) {
      const batch = pendingFiles.slice(i, i + concurrentLimit);
      const batchPromises = batch.map(file => uploadSingleFile(file));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(photo => {
        if (photo) {
          uploadedPhotos.push(photo);
        }
      });
    }

    setIsUploading(false);
    setUploadComplete(true);

    // 通知父组件
    if (uploadedPhotos.length > 0) {
      onPhotosUploaded(uploadedPhotos);
    }
  };

  const handleClose = () => {
    // 清理预览URL
    uploadFiles.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    
    setUploadFiles([]);
    setUploadComplete(false);
    setIsUploading(false);
    setGlobalSettings({
      location: '',
      relatedPeople: [],
      tags: [],
      applyToAll: false,
    });
    
    onClose();
  };

  const addPerson = (person: string) => {
    if (person.trim() && !globalSettings.relatedPeople.includes(person.trim())) {
      setGlobalSettings(prev => ({
        ...prev,
        relatedPeople: [...prev.relatedPeople, person.trim()]
      }));
    }
  };

  const removePerson = (person: string) => {
    setGlobalSettings(prev => ({
      ...prev,
      relatedPeople: prev.relatedPeople.filter(p => p !== person)
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !globalSettings.tags.includes(tag.trim())) {
      setGlobalSettings(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setGlobalSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const successCount = uploadFiles.filter(f => f.status === 'success').length;
  const errorCount = uploadFiles.filter(f => f.status === 'error').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            📤 批量上传照片
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {uploadComplete ? (
            // 上传完成页面
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">批量上传完成</h3>
              <p className="text-gray-600 mb-4">
                成功上传 {successCount} 张照片
                {errorCount > 0 && `，${errorCount} 张失败`}
              </p>
              <Button onClick={handleClose}>
                完成
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 文件选择区域 */}
              {uploadFiles.length === 0 && (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📁</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">选择照片文件</h3>
                  <p className="text-gray-500 mb-4">
                    拖拽照片到此处，或点击选择文件
                  </p>
                  <p className="text-sm text-gray-400">
                    支持 JPG, PNG, GIF 等图片格式
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              {/* 全局设置 */}
              {uploadFiles.length > 0 && !isUploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="applyToAll"
                      checked={globalSettings.applyToAll}
                      onChange={(e) => setGlobalSettings(prev => ({
                        ...prev,
                        applyToAll: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="applyToAll" className="text-sm font-medium text-gray-900">
                      为所有照片应用统一设置
                    </label>
                  </div>

                  {globalSettings.applyToAll && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 地点 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          地点
                        </label>
                        <input
                          type="text"
                          value={globalSettings.location}
                          onChange={(e) => setGlobalSettings(prev => ({
                            ...prev,
                            location: e.target.value
                          }))}
                          placeholder="拍摄地点"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 人物 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          相关人物
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="输入人物姓名后按回车"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addPerson(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <div className="flex flex-wrap gap-1">
                            {globalSettings.relatedPeople.map(person => (
                              <span
                                key={person}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                              >
                                👤 {person}
                                <button
                                  onClick={() => removePerson(person)}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 标签 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          标签
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="输入标签后按回车"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTag(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <div className="flex flex-wrap gap-1">
                            {globalSettings.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md"
                              >
                                #{tag}
                                <button
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 文件列表 */}
              {uploadFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      待上传文件 ({uploadFiles.length})
                    </h3>
                    {!isUploading && (
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                      >
                        继续添加
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {uploadFiles.map((uploadFile) => (
                      <div
                        key={uploadFile.id}
                        className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                      >
                        {/* 预览图 */}
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={uploadFile.preview}
                            alt={uploadFile.name}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* 状态指示器 */}
                          <div className="absolute top-2 right-2">
                            {uploadFile.status === 'pending' && !isUploading && (
                              <button
                                onClick={() => removeFile(uploadFile.id)}
                                className="w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            )}
                            {uploadFile.status === 'uploading' && (
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                            {uploadFile.status === 'success' && (
                              <div className="w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">
                                ✓
                              </div>
                            )}
                            {uploadFile.status === 'error' && (
                              <div className="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                                !
                              </div>
                            )}
                          </div>

                          {/* 进度条 */}
                          {uploadFile.status === 'uploading' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${uploadFile.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>

                        {/* 文件信息 */}
                        <div className="p-3">
                          <input
                            type="text"
                            value={uploadFile.name}
                            onChange={(e) => updateFileName(uploadFile.id, e.target.value)}
                            disabled={isUploading}
                            className="w-full text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                          
                          {uploadFile.status === 'error' && (
                            <p className="text-xs text-red-600 mt-1">
                              {uploadFile.error}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round(uploadFile.file.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {isUploading && (
                        <span>正在上传... {successCount + errorCount} / {uploadFiles.length}</span>
                      )}
                    </div>
                    
                    <div className="space-x-3">
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isUploading}
                      >
                        取消
                      </Button>
                      
                      <Button
                        onClick={startBatchUpload}
                        disabled={isUploading || uploadFiles.length === 0}
                      >
                        {isUploading ? '上传中...' : `开始上传 (${uploadFiles.filter(f => f.status === 'pending' || f.status === 'error').length})`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}