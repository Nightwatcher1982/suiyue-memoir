'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { Photo } from '@/types';

interface PhotoEditModalProps {
  isOpen: boolean;
  photo: Photo;
  onClose: () => void;
  onPhotoUpdated: (photo: Photo) => void;
}

export function PhotoEditModal({
  isOpen,
  photo,
  onClose,
  onPhotoUpdated
}: PhotoEditModalProps) {
  const [saving, setSaving] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    relatedPeople: [] as string[],
    photographyDate: '',
    location: '',
    tags: [] as string[],
  });

  const [currentPersonInput, setCurrentPersonInput] = useState('');
  const [currentTagInput, setCurrentTagInput] = useState('');

  // 初始化表单数据
  useEffect(() => {
    if (photo) {
      setFormData({
        name: photo.name,
        description: photo.description || '',
        relatedPeople: photo.relatedPeople || [],
        photographyDate: photo.photographyDate ? 
          new Date(photo.photographyDate).toISOString().split('T')[0] : '',
        location: photo.location || '',
        tags: photo.tags || [],
      });
    }
  }, [photo]);

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
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      
      const updates: Partial<Photo> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        relatedPeople: formData.relatedPeople.length > 0 ? formData.relatedPeople : undefined,
        photographyDate: formData.photographyDate ? new Date(formData.photographyDate) : undefined,
        location: formData.location.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await databaseService.updatePhoto(photo.id, updates);
      
      const updatedPhoto: Photo = {
        ...photo,
        ...updates,
        updatedAt: new Date(),
      };

      onPhotoUpdated(updatedPhoto);
      onClose();
      
    } catch (error) {
      console.error('更新照片失败:', error);
      alert('更新照片失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setCurrentPersonInput('');
    setCurrentTagInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">编辑照片信息</h2>
          
          {/* 照片预览 */}
          <div className="mb-6">
            <img
              src={photo.thumbnail || photo.url}
              alt={photo.name}
              className="w-full h-48 object-contain border rounded-lg bg-gray-50"
            />
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                      👤 {person}
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
                disabled={saving}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.name.trim()}
              >
                {saving ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}