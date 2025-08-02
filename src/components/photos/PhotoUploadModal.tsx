'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { generateId } from '@/lib/utils';
import type { Photo } from '@/types';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoUploaded: (photo: Photo) => void;
  projectId?: string;
  chapterId?: string;
  defaultName?: string;
}

export function PhotoUploadModal({
  isOpen,
  onClose,
  onPhotoUploaded,
  projectId,
  chapterId,
  defaultName = ''
}: PhotoUploadModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: defaultName,
    description: '',
    relatedPeople: [] as string[],
    photographyDate: '',
    location: '',
    tags: [] as string[],
  });

  const [currentPersonInput, setCurrentPersonInput] = useState('');
  const [currentTagInput, setCurrentTagInput] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // 创建预览URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // 如果没有设置名称，使用文件名
      if (!formData.name) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // 去掉扩展名
        setFormData(prev => ({ ...prev, name: fileName }));
      }
    }
  };

  const addPerson = () => {
    if (currentPersonInput.trim() && !formData.relatedPeople.includes(currentPersonInput.trim())) {
      setFormData(prev => ({
        ...prev,
        relatedPeople: [...prev.relatedPeople, currentPersonInput.trim()]
      }));
      setCurrentPersonInput('');
    }
  };

  const removePerson = (person: string) => {
    setFormData(prev => ({
      ...prev,
      relatedPeople: prev.relatedPeople.filter(p => p !== person)
    }));
  };

  const addTag = () => {
    if (currentTagInput.trim() && !formData.tags.includes(currentTagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTagInput.trim()]
      }));
      setCurrentTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user || !formData.name.trim()) return;

    setUploading(true);
    try {
      // 首先上传文件到CloudBase存储
      console.log('📤 开始上传文件到CloudBase存储...');
      const { storageService } = await import('@/lib/cloudbase/storage');
      
      const uploadResult = await storageService.uploadPhoto(
        selectedFile, 
        user.id, 
        chapterId
      );
      
      console.log('✅ 文件上传成功:', uploadResult);
      
      // 获取图片尺寸
      const { width, height } = await getImageDimensions(selectedFile);
      
      const { databaseService } = await import('@/lib/cloudbase/database');
      
      const photoData: Omit<Photo, 'id' | 'createdAt' | 'updatedAt'> = {
        url: uploadResult.downloadUrl,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        relatedPeople: formData.relatedPeople.length > 0 ? formData.relatedPeople : undefined,
        photographyDate: formData.photographyDate ? new Date(formData.photographyDate) : undefined,
        location: formData.location.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        userId: user.id,
        projectId,
        chapterId,
        uploadedAt: new Date(),
        fileId: uploadResult.fileId, // CloudBase文件ID
        storageUrl: uploadResult.downloadUrl, // 永久存储URL
        metadata: {
          width,
          height,
          format: selectedFile.type,
          size: selectedFile.size,
        },
      };

      const photoId = await databaseService.createPhoto(photoData);
      
      const newPhoto: Photo = {
        ...photoData,
        id: photoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('✅ 照片数据已保存到数据库:', photoId);
      onPhotoUploaded(newPhoto);
      handleClose();
      
    } catch (error) {
      console.error('照片上传失败:', error);
      alert(`照片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };

  // 获取图片尺寸的辅助函数
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('无法获取图片尺寸'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData({
      name: defaultName,
      description: '',
      relatedPeople: [],
      photographyDate: '',
      location: '',
      tags: [],
    });
    setCurrentPersonInput('');
    setCurrentTagInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">上传照片</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 文件选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择照片 *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>

            {/* 预览图片 */}
            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="预览"
                  className="max-w-full h-48 object-contain border rounded-lg"
                />
              </div>
            )}

            {/* 照片名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                照片名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="为这张照片起个名字..."
                required
              />
            </div>

            {/* 详细描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="描述这张照片的背景、故事或意义..."
              />
            </div>

            {/* 相关人物 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                相关人物
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={currentPersonInput}
                  onChange={(e) => setCurrentPersonInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入人物姓名..."
                />
                <Button type="button" onClick={addPerson} size="sm">
                  添加
                </Button>
              </div>
              {formData.relatedPeople.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.relatedPeople.map((person, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                    >
                      {person}
                      <button
                        type="button"
                        onClick={() => removePerson(person)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 摄影时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                摄影时间
              </label>
              <input
                type="date"
                value={formData.photographyDate}
                onChange={(e) => setFormData(prev => ({ ...prev, photographyDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 拍摄地点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拍摄地点
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="这张照片在哪里拍摄的？"
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={currentTagInput}
                  onChange={(e) => setCurrentTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入标签..."
                />
                <Button type="button" onClick={addTag} size="sm">
                  添加
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 按钮 */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={uploading || !selectedFile || !formData.name.trim()}
              >
                {uploading ? '上传中...' : '上传照片'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}