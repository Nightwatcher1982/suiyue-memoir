'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { PhotoUploadModal } from '@/components/photos/PhotoUploadModal';
import { PhotoViewModal } from '@/components/photos/PhotoViewModal';
import { PhotoEditModal } from '@/components/photos/PhotoEditModal';
import { PhotoWall } from '@/components/photos/PhotoWall';
import { BatchUploadModal } from '@/components/photos/BatchUploadModal';
import { SmartImage } from '@/components/photos/SmartImage';
import { formatDate } from '@/lib/utils';
import type { Photo } from '@/types';

export default function PhotoArchivePage() {
  const { user, loading } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // 搜索和过滤状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'created'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'wall'>('wall');
  const [groupBy, setGroupBy] = useState<'decade' | 'year' | 'location' | 'people' | 'tags'>('decade');

  // 加载用户照片
  const loadPhotos = async () => {
    if (!user) return;

    setDataLoading(true);
    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      const userPhotos = await databaseService.getUserPhotos(user.id);
      setPhotos(userPhotos);
      setFilteredPhotos(userPhotos);
    } catch (error) {
      console.error('加载照片失败:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPhotos();
    }
  }, [user]);

  // 获取所有可用的标签和人物
  const allTags = Array.from(new Set(photos.flatMap(photo => photo.tags || [])));
  const allPeople = Array.from(new Set(photos.flatMap(photo => photo.relatedPeople || [])));

  // 过滤和排序照片
  useEffect(() => {
    let filtered = [...photos];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(photo =>
        photo.name.toLowerCase().includes(query) ||
        photo.description?.toLowerCase().includes(query) ||
        photo.location?.toLowerCase().includes(query)
      );
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter(photo =>
        photo.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // 人物过滤
    if (selectedPeople.length > 0) {
      filtered = filtered.filter(photo =>
        photo.relatedPeople?.some(person => selectedPeople.includes(person))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = a.photographyDate || a.createdAt;
          bValue = b.photographyDate || b.createdAt;
          break;
        case 'created':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPhotos(filtered);
  }, [photos, searchQuery, selectedTags, selectedPeople, sortBy, sortOrder]);

  const handlePhotoUploaded = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const handlePhotosUploaded = (newPhotos: Photo[]) => {
    setPhotos(prev => [...newPhotos, ...prev]);
  };

  const handlePhotoUpdated = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
  };

  const handlePhotoDeleted = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？此操作无法撤销。')) return;

    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      await databaseService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setSelectedPhoto(null);
      setShowViewModal(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('删除照片失败:', error);
      alert('删除照片失败，请重试');
    }
  };

  // 刷新CloudBase临时URL的辅助函数
  const refreshPhotoUrl = async (photoId: string, fileId: string): Promise<string> => {
    try {
      const { storageService } = await import('@/lib/cloudbase/storage');
      const newUrl = await storageService.getDownloadUrl(fileId);
      
      // 更新本地状态中的URL
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, url: newUrl } : photo
      ));
      
      // 更新数据库中的URL
      const { databaseService } = await import('@/lib/cloudbase/database');
      await databaseService.updatePhoto(photoId, { url: newUrl });
      
      return newUrl;
    } catch (error) {
      console.error('刷新照片URL失败:', error);
      throw error;
    }
  };

  const handleViewPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowViewModal(true);
  };

  const handleEditPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedPeople([]);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600">您需要登录后才能访问照片档案</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
              >
                ← 返回工作台
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">📸 照片档案</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(true)}
              >
                📤 单张上传
              </Button>
              <Button onClick={() => setShowBatchUploadModal(true)}>
                📁 批量上传
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和过滤栏 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 搜索框 */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="搜索照片名称、描述或地点..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 过滤器 */}
            <div className="flex items-center space-x-4">
              {/* 标签过滤 */}
              {allTags.length > 0 && (
                <select
                  multiple
                  value={selectedTags}
                  onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择标签</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              )}

              {/* 排序 */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">摄影时间 ↓</option>
                <option value="date-asc">摄影时间 ↑</option>
                <option value="created-desc">上传时间 ↓</option>
                <option value="created-asc">上传时间 ↑</option>
                <option value="name-asc">名称 A-Z</option>
                <option value="name-desc">名称 Z-A</option>
              </select>

              {/* 分组方式 */}
              {viewMode === 'wall' && (
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="decade">按年代分组</option>
                  <option value="year">按年份分组</option>
                  <option value="location">按地点分组</option>
                  <option value="people">按人物分组</option>
                  <option value="tags">按标签分组</option>
                </select>
              )}

              {/* 视图模式 */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('wall')}
                  className={`px-3 py-2 text-sm ${viewMode === 'wall' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                >
                  照片墙
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                >
                  网格
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                >
                  列表
                </button>
              </div>

              {/* 清空过滤器 */}
              {(searchQuery || selectedTags.length > 0 || selectedPeople.length > 0) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  清空
                </Button>
              )}
            </div>
          </div>

          {/* 活跃过滤器显示 */}
          {(selectedTags.length > 0 || selectedPeople.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                  #{tag}
                  <button
                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedPeople.map(person => (
                <span key={person} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                  👤 {person}
                  <button
                    onClick={() => setSelectedPeople(prev => prev.filter(p => p !== person))}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mb-6">
          <p className="text-gray-600">
            显示 {filteredPhotos.length} / {photos.length} 张照片
          </p>
        </div>

        {/* 照片展示 */}
        {dataLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载照片中...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📸</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {photos.length === 0 ? '还没有照片' : '没有找到匹配的照片'}
            </h3>
            <p className="text-gray-500 mb-6">
              {photos.length === 0 ? '上传您的第一张照片开始建立档案' : '尝试调整搜索条件或清空过滤器'}
            </p>
            {photos.length === 0 && (
              <div className="space-x-3">
                <Button onClick={() => setShowUploadModal(true)}>
                  📤 单张上传
                </Button>
                <Button variant="outline" onClick={() => setShowBatchUploadModal(true)}>
                  📁 批量上传
                </Button>
              </div>
            )}
          </div>
        ) : viewMode === 'wall' ? (
          <PhotoWall
            photos={filteredPhotos}
            groupBy={groupBy}
            onPhotoClick={handleViewPhoto}
            onPhotosUpdate={setPhotos}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewPhoto(photo)}
              >
                <div className="aspect-square bg-gray-100">
                  <SmartImage
                    photo={photo}
                    className="w-full h-full object-cover"
                    onUrlRefreshed={(newUrl) => {
                      setPhotos(prev => prev.map(p => 
                        p.id === photo.id ? { ...p, url: newUrl } : p
                      ));
                    }}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate">{photo.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {photo.photographyDate ? formatDate(photo.photographyDate) : formatDate(photo.createdAt)}
                  </p>
                  {photo.relatedPeople && photo.relatedPeople.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      👤 {photo.relatedPeople.slice(0, 2).join(', ')}
                      {photo.relatedPeople.length > 2 && ` +${photo.relatedPeople.length - 2}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewPhoto(photo)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <SmartImage
                        photo={photo}
                        className="w-full h-full object-cover"
                        onUrlRefreshed={(newUrl) => {
                          setPhotos(prev => prev.map(p => 
                            p.id === photo.id ? { ...p, url: newUrl } : p
                          ));
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{photo.name}</h3>
                      {photo.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{photo.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>
                          {photo.photographyDate ? formatDate(photo.photographyDate) : formatDate(photo.createdAt)}
                        </span>
                        {photo.location && <span>📍 {photo.location}</span>}
                        {photo.relatedPeople && photo.relatedPeople.length > 0 && (
                          <span>👤 {photo.relatedPeople.join(', ')}</span>
                        )}
                      </div>
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {photo.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPhoto(photo);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 模态框 */}
      <PhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onPhotoUploaded={handlePhotoUploaded}
      />

      <BatchUploadModal
        isOpen={showBatchUploadModal}
        onClose={() => setShowBatchUploadModal(false)}
        onPhotosUploaded={handlePhotosUploaded}
      />

      {selectedPhoto && (
        <>
          <PhotoViewModal
            isOpen={showViewModal}
            photo={selectedPhoto}
            onClose={() => setShowViewModal(false)}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}
            onDelete={() => handlePhotoDeleted(selectedPhoto.id)}
            onPhotoUpdated={handlePhotoUpdated}
          />

          <PhotoEditModal
            isOpen={showEditModal}
            photo={selectedPhoto}
            onClose={() => setShowEditModal(false)}
            onPhotoUpdated={handlePhotoUpdated}
          />
        </>
      )}
    </div>
  );
}