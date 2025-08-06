'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import type { Person } from '@/types/relationship';

interface PersonModalProps {
  isOpen: boolean;
  person?: Person;
  onClose: () => void;
  onSave: (personData: Partial<Person>) => void;
  onDelete?: (personId: string) => void;
}

export function PersonModal({ isOpen, person, onClose, onSave, onDelete }: PersonModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    birth: '',
    death: '',
    birthPlace: '',
    currentPlace: '',
    occupation: '',
    description: '',
    isDeceased: false,
    avatar: '',
  });
  const [stories, setStories] = useState<string[]>([]);
  const [currentStory, setCurrentStory] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (person) {
        // 编辑模式
        setFormData({
          name: person.name || '',
          nickname: person.nickname || '',
          birth: person.birth ? person.birth.toISOString().split('T')[0] : '',
          death: person.death ? person.death.toISOString().split('T')[0] : '',
          birthPlace: person.birthPlace || '',
          currentPlace: person.currentPlace || '',
          occupation: person.occupation || '',
          description: person.description || '',
          isDeceased: person.isDeceased || false,
          avatar: person.avatar || '',
        });
        setStories(person.stories || []);
        setAvatarPreview(person.avatar || '');
      } else {
        // 新建模式
        setFormData({
          name: '',
          nickname: '',
          birth: '',
          death: '',
          birthPlace: '',
          currentPlace: '',
          occupation: '',
          description: '',
          isDeceased: false,
          avatar: '',
        });
        setStories([]);
        setAvatarPreview('');
      }
      setCurrentStory('');
    }
  }, [isOpen, person]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddStory = () => {
    if (currentStory.trim()) {
      setStories(prev => [...prev, currentStory.trim()]);
      setCurrentStory('');
    }
  };

  const handleRemoveStory = (index: number) => {
    setStories(prev => prev.filter((_, i) => i !== index));
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }

    setUploading(true);
    try {
      // 创建预览
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // 上传到存储服务
      const { storageService } = await import('@/lib/cloudbase/storage');
      const uploadResult = await storageService.uploadPhoto(file, 'user_id', 'avatars');
      
      setFormData(prev => ({
        ...prev,
        avatar: uploadResult.downloadUrl
      }));

      console.log('头像上传成功:', uploadResult.downloadUrl);
    } catch (error) {
      console.error('头像上传失败:', error);
      alert('头像上传失败，请重试');
      setAvatarPreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入姓名');
      return;
    }

    const personData: Partial<Person> = {
      ...formData,
      name: formData.name.trim(),
      nickname: formData.nickname.trim() || undefined,
      birth: formData.birth ? new Date(formData.birth) : undefined,
      death: formData.death ? new Date(formData.death) : undefined,
      birthPlace: formData.birthPlace.trim() || undefined,
      currentPlace: formData.currentPlace.trim() || undefined,
      occupation: formData.occupation.trim() || undefined,
      description: formData.description.trim() || undefined,
      stories: stories.length > 0 ? stories : undefined,
    };

    onSave(personData);
  };

  const handleDelete = () => {
    if (person && onDelete) {
      if (confirm(`确定要删除 ${person.name} 吗？此操作无法撤销。`)) {
        onDelete(person.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {person ? `编辑 ${person.name}` : '添加新人物'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* 头像上传 */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="头像预览"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '选择头像'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  支持JPG、PNG格式，大小不超过2MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  昵称/小名
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="昵称或小名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  出生日期
                </label>
                <input
                  type="date"
                  value={formData.birth}
                  onChange={(e) => handleInputChange('birth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <input
                    type="checkbox"
                    id="isDeceased"
                    checked={formData.isDeceased}
                    onChange={(e) => handleInputChange('isDeceased', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isDeceased" className="text-sm font-medium text-gray-700">
                    已故世
                  </label>
                </div>
                {formData.isDeceased && (
                  <input
                    type="date"
                    value={formData.death}
                    onChange={(e) => handleInputChange('death', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="逝世日期"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  出生地
                </label>
                <input
                  type="text"
                  value={formData.birthPlace}
                  onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="出生地点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  现居地
                </label>
                <input
                  type="text"
                  value={formData.currentPlace}
                  onChange={(e) => handleInputChange('currentPlace', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="当前居住地"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                职业
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="职业或工作"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                简介
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="简单介绍这个人物..."
              />
            </div>

            {/* 相关故事 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                相关故事
              </label>
              
              {/* 已添加的故事 */}
              {stories.length > 0 && (
                <div className="space-y-2 mb-3">
                  {stories.map((story, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
                      <div className="flex-1 text-sm text-gray-700">
                        {story}
                      </div>
                      <button
                        onClick={() => handleRemoveStory(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加新故事 */}
              <div className="space-y-2">
                <textarea
                  value={currentStory}
                  onChange={(e) => setCurrentStory(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="记录与这个人相关的故事或回忆..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStory}
                  disabled={!currentStory.trim()}
                >
                  添加故事
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {person && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                删除人物
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim()}
            >
              {person ? '保存修改' : '添加人物'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}