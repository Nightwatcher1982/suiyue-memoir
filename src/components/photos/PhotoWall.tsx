'use client';

import React, { useState, useMemo } from 'react';
import { SmartImage } from './SmartImage';
import { formatDate } from '@/lib/utils';
import type { Photo } from '@/types';

interface PhotoGroup {
  id: string;
  title: string;
  photos: Photo[];
  startYear: number;
  endYear: number;
}

interface PhotoWallProps {
  photos: Photo[];
  groupBy: 'decade' | 'year' | 'location' | 'people' | 'tags';
  onPhotoClick: (photo: Photo) => void;
  onPhotosUpdate?: (photos: Photo[]) => void;
  className?: string;
}

export function PhotoWall({ 
  photos, 
  groupBy, 
  onPhotoClick, 
  onPhotosUpdate,
  className = '' 
}: PhotoWallProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 根据不同分组方式组织照片
  const photoGroups = useMemo(() => {
    const groups: PhotoGroup[] = [];

    switch (groupBy) {
      case 'decade': {
        // 按10年分组
        const decadeMap = new Map<number, Photo[]>();
        
        photos.forEach(photo => {
          const date = photo.photographyDate || photo.createdAt;
          const year = new Date(date).getFullYear();
          const decade = Math.floor(year / 10) * 10;
          
          if (!decadeMap.has(decade)) {
            decadeMap.set(decade, []);
          }
          decadeMap.get(decade)!.push(photo);
        });

        decadeMap.forEach((photos, decade) => {
          const endDecade = decade + 9;
          groups.push({
            id: `decade-${decade}`,
            title: `${decade}年代`,
            photos: photos.sort((a, b) => {
              const aDate = a.photographyDate || a.createdAt;
              const bDate = b.photographyDate || b.createdAt;
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            }),
            startYear: decade,
            endYear: endDecade,
          });
        });

        // 按年代倒序排序
        groups.sort((a, b) => b.startYear - a.startYear);
        break;
      }

      case 'year': {
        // 按年份分组
        const yearMap = new Map<number, Photo[]>();
        
        photos.forEach(photo => {
          const date = photo.photographyDate || photo.createdAt;
          const year = new Date(date).getFullYear();
          
          if (!yearMap.has(year)) {
            yearMap.set(year, []);
          }
          yearMap.get(year)!.push(photo);
        });

        yearMap.forEach((photos, year) => {
          groups.push({
            id: `year-${year}`,
            title: `${year}年`,
            photos: photos.sort((a, b) => {
              const aDate = a.photographyDate || a.createdAt;
              const bDate = b.photographyDate || b.createdAt;
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            }),
            startYear: year,
            endYear: year,
          });
        });

        // 按年份倒序排序
        groups.sort((a, b) => b.startYear - a.startYear);
        break;
      }

      case 'location': {
        // 按地点分组
        const locationMap = new Map<string, Photo[]>();
        
        photos.forEach(photo => {
          const location = photo.location || '未知地点';
          
          if (!locationMap.has(location)) {
            locationMap.set(location, []);
          }
          locationMap.get(location)!.push(photo);
        });

        locationMap.forEach((photos, location) => {
          const sortedPhotos = photos.sort((a, b) => {
            const aDate = a.photographyDate || a.createdAt;
            const bDate = b.photographyDate || b.createdAt;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          });

          groups.push({
            id: `location-${location}`,
            title: `📍 ${location}`,
            photos: sortedPhotos,
            startYear: new Date(sortedPhotos[sortedPhotos.length - 1].photographyDate || sortedPhotos[sortedPhotos.length - 1].createdAt).getFullYear(),
            endYear: new Date(sortedPhotos[0].photographyDate || sortedPhotos[0].createdAt).getFullYear(),
          });
        });

        // 按最新照片时间排序
        groups.sort((a, b) => b.endYear - a.endYear);
        break;
      }

      case 'people': {
        // 按人物分组
        const peopleMap = new Map<string, Photo[]>();
        
        photos.forEach(photo => {
          if (photo.relatedPeople && photo.relatedPeople.length > 0) {
            photo.relatedPeople.forEach(person => {
              if (!peopleMap.has(person)) {
                peopleMap.set(person, []);
              }
              peopleMap.get(person)!.push(photo);
            });
          } else {
            // 没有关联人物的照片
            const key = '其他照片';
            if (!peopleMap.has(key)) {
              peopleMap.set(key, []);
            }
            peopleMap.get(key)!.push(photo);
          }
        });

        peopleMap.forEach((photos, person) => {
          const uniquePhotos = Array.from(new Map(photos.map(p => [p.id, p])).values());
          const sortedPhotos = uniquePhotos.sort((a, b) => {
            const aDate = a.photographyDate || a.createdAt;
            const bDate = b.photographyDate || b.createdAt;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          });

          groups.push({
            id: `people-${person}`,
            title: person === '其他照片' ? '📂 其他照片' : `👤 ${person}`,
            photos: sortedPhotos,
            startYear: new Date(sortedPhotos[sortedPhotos.length - 1].photographyDate || sortedPhotos[sortedPhotos.length - 1].createdAt).getFullYear(),
            endYear: new Date(sortedPhotos[0].photographyDate || sortedPhotos[0].createdAt).getFullYear(),
          });
        });

        // 按照片数量排序
        groups.sort((a, b) => b.photos.length - a.photos.length);
        break;
      }

      case 'tags': {
        // 按标签分组
        const tagMap = new Map<string, Photo[]>();
        
        photos.forEach(photo => {
          if (photo.tags && photo.tags.length > 0) {
            photo.tags.forEach(tag => {
              if (!tagMap.has(tag)) {
                tagMap.set(tag, []);
              }
              tagMap.get(tag)!.push(photo);
            });
          } else {
            // 没有标签的照片
            const key = '未分类';
            if (!tagMap.has(key)) {
              tagMap.set(key, []);
            }
            tagMap.get(key)!.push(photo);
          }
        });

        tagMap.forEach((photos, tag) => {
          const uniquePhotos = Array.from(new Map(photos.map(p => [p.id, p])).values());
          const sortedPhotos = uniquePhotos.sort((a, b) => {
            const aDate = a.photographyDate || a.createdAt;
            const bDate = b.photographyDate || b.createdAt;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          });

          groups.push({
            id: `tag-${tag}`,
            title: tag === '未分类' ? '📂 未分类' : `#${tag}`,
            photos: sortedPhotos,
            startYear: new Date(sortedPhotos[sortedPhotos.length - 1].photographyDate || sortedPhotos[sortedPhotos.length - 1].createdAt).getFullYear(),
            endYear: new Date(sortedPhotos[0].photographyDate || sortedPhotos[0].createdAt).getFullYear(),
          });
        });

        // 按照片数量排序
        groups.sort((a, b) => b.photos.length - a.photos.length);
        break;
      }
    }

    return groups;
  }, [photos, groupBy]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    setExpandedGroups(new Set(photoGroups.map(g => g.id)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  if (photoGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">📸</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">没有照片</h3>
        <p className="text-gray-500">上传一些照片来创建您的照片墙</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          共 {photoGroups.length} 个分组，{photos.length} 张照片
        </div>
        <div className="flex space-x-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            展开全部
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            收起全部
          </button>
        </div>
      </div>

      {/* 照片分组 */}
      {photoGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);
        
        return (
          <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* 分组标题 */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{isExpanded ? '📂' : '📁'}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{group.title}</h3>
                  <p className="text-sm text-gray-500">
                    {group.photos.length} 张照片
                    {groupBy === 'decade' || groupBy === 'year' ? 
                      ` • ${group.startYear === group.endYear ? group.startYear : `${group.startYear} - ${group.endYear}`}` 
                      : ''
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* 预览缩略图 */}
                <div className="flex -space-x-2">
                  {group.photos.slice(0, 3).map((photo, index) => (
                    <div
                      key={photo.id}
                      className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100"
                      style={{ zIndex: 3 - index }}
                    >
                      <SmartImage
                        photo={photo}
                        className="w-full h-full object-cover"
                        onUrlRefreshed={(newUrl) => {
                          if (onPhotosUpdate) {
                            const updatedPhotos = photos.map(p => 
                              p.id === photo.id ? { ...p, url: newUrl } : p
                            );
                            onPhotosUpdate(updatedPhotos);
                          }
                        }}
                      />
                    </div>
                  ))}
                  {group.photos.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                      +{group.photos.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-gray-400 transform transition-transform duration-200" style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▼
                </span>
              </div>
            </div>

            {/* 照片网格 */}
            {isExpanded && (
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {group.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50 transition-all duration-200"
                      onClick={() => onPhotoClick(photo)}
                    >
                      <SmartImage
                        photo={photo}
                        className="w-full h-full object-cover"
                        onUrlRefreshed={(newUrl) => {
                          if (onPhotosUpdate) {
                            const updatedPhotos = photos.map(p => 
                              p.id === photo.id ? { ...p, url: newUrl } : p
                            );
                            onPhotosUpdate(updatedPhotos);
                          }
                        }}
                      />
                      
                      {/* 悬停信息覆盖层 */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-end">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 w-full">
                          <div className="text-white text-xs">
                            <p className="font-medium truncate">{photo.name}</p>
                            <p className="text-gray-200 text-xs">
                              {photo.photographyDate ? formatDate(photo.photographyDate) : formatDate(photo.createdAt)}
                            </p>
                            {photo.location && (
                              <p className="text-gray-300 text-xs truncate">📍 {photo.location}</p>
                            )}
                            {photo.relatedPeople && photo.relatedPeople.length > 0 && (
                              <p className="text-gray-300 text-xs truncate">
                                👤 {photo.relatedPeople.slice(0, 2).join(', ')}
                                {photo.relatedPeople.length > 2 && '...'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}