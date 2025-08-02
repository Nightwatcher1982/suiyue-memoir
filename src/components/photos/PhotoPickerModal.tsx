'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { SmartImage } from './SmartImage';
import { formatDate } from '@/lib/utils';
import type { Photo } from '@/types';

interface PhotoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (photo: Photo) => void;
  projectId?: string;
  chapterId?: string;
}

export function PhotoPickerModal({
  isOpen,
  onClose,
  onPhotoSelected,
  projectId,
  chapterId
}: PhotoPickerModalProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<'all' | 'project' | 'chapter'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 加载照片数据
  useEffect(() => {
    if (!isOpen || !user) return;

    const loadPhotos = async () => {
      setLoading(true);
      try {
        const { databaseService } = await import('@/lib/cloudbase/database');
        
        // 根据选择的范围加载不同的照片
        let loadedPhotos: Photo[] = [];
        
        switch (selectedScope) {
          case 'chapter':
            if (chapterId) {
              loadedPhotos = await databaseService.getChapterPhotos(chapterId);
            }
            break;
          case 'project':
            if (projectId) {
              loadedPhotos = await databaseService.getProjectPhotos(projectId);
            }
            break;
          default:
            loadedPhotos = await databaseService.getUserPhotos(user.id);
        }

        // 过滤掉blob URL的照片
        const validPhotos = loadedPhotos.filter(photo => 
          photo.url && !photo.url.startsWith('blob:')
        );

        setPhotos(validPhotos);
      } catch (error) {
        console.error('加载照片失败:', error);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [isOpen, user, selectedScope, projectId, chapterId]);

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPhotos(photos);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = photos.filter(photo =>
      photo.name.toLowerCase().includes(query) ||
      photo.description?.toLowerCase().includes(query) ||
      photo.location?.toLowerCase().includes(query) ||
      photo.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      photo.relatedPeople?.some(person => person.toLowerCase().includes(query))
    );

    setFilteredPhotos(filtered);
  }, [photos, searchQuery]);

  const handlePhotoSelect = (photo: Photo) => {
    onPhotoSelected(photo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[80vh] flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">选择照片插入编辑器</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 工具栏 */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索框 */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="搜索照片名称、描述、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 范围选择和视图切换 */}
            <div className="flex items-center space-x-4">
              {/* 范围选择 */}
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部照片</option>
                {projectId && <option value="project">本项目照片</option>}
                {chapterId && <option value="chapter">本章节照片</option>}
              </select>

              {/* 视图切换 */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🔲 网格
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm border-l ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋 列表
                </button>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-3 text-sm text-gray-600">
            显示 {filteredPhotos.length} / {photos.length} 张照片
          </div>
        </div>

        {/* 照片展示区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">加载照片中...</p>
              </div>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📸</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {photos.length === 0 ? '还没有照片' : '没有找到匹配的照片'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {photos.length === 0 
                    ? '请先在照片档案中上传一些照片' 
                    : '尝试调整搜索条件或选择不同的范围'}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/photos', '_blank')}
                >
                  📤 去上传照片
                </Button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handlePhotoSelect(photo)}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    <SmartImage
                      photo={photo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <span className="text-blue-600">✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{photo.name}</h3>
                    <p className="text-xs text-gray-500">
                      {photo.photographyDate ? formatDate(photo.photographyDate) : formatDate(photo.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handlePhotoSelect(photo)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <SmartImage
                        photo={photo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{photo.name}</h3>
                      {photo.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{photo.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>
                          {photo.photographyDate ? formatDate(photo.photographyDate) : formatDate(photo.createdAt)}
                        </span>
                        {photo.location && <span>📍 {photo.location}</span>}
                        {photo.relatedPeople && photo.relatedPeople.length > 0 && (
                          <span>👤 {photo.relatedPeople.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                          <span>选择</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}