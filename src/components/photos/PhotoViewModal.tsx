'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { SmartImage } from './SmartImage';
import { formatDate } from '@/lib/utils';
import type { Photo } from '@/types';

interface PhotoViewModalProps {
  isOpen: boolean;
  photo: Photo;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPhotoUpdated?: (updatedPhoto: Photo) => void;
}

export function PhotoViewModal({
  isOpen,
  photo,
  onClose,
  onEdit,
  onDelete,
  onPhotoUpdated
}: PhotoViewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75"
          >
            ×
          </button>

          {/* 照片显示 */}
          <div className="bg-black rounded-t-lg">
            <SmartImage
              photo={photo}
              className="w-full max-h-96 object-contain"
              onUrlRefreshed={(newUrl) => {
                if (onPhotoUpdated) {
                  onPhotoUpdated({ ...photo, url: newUrl });
                }
              }}
            />
          </div>

          {/* 照片信息 */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{photo.name}</h2>
                {photo.description && (
                  <p className="text-gray-700 leading-relaxed">{photo.description}</p>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <Button size="sm" onClick={onEdit}>
                  ✏️ 编辑
                </Button>
                <Button size="sm" variant="outline" onClick={onDelete}>
                  🗑️ 删除
                </Button>
              </div>
            </div>

            {/* 元数据网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">基本信息</h3>
                
                {photo.photographyDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">摄影时间</dt>
                    <dd className="text-sm text-gray-900">{formatDate(photo.photographyDate)}</dd>
                  </div>
                )}

                {photo.location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">拍摄地点</dt>
                    <dd className="text-sm text-gray-900">📍 {photo.location}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">上传时间</dt>
                  <dd className="text-sm text-gray-900">{formatDate(photo.uploadedAt)}</dd>
                </div>

                {photo.metadata && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">文件信息</dt>
                    <dd className="text-sm text-gray-900">
                      {photo.metadata.format} • {Math.round(photo.metadata.size / 1024)} KB
                      {photo.metadata.width && photo.metadata.height && (
                        <> • {photo.metadata.width} × {photo.metadata.height}</>
                      )}
                    </dd>
                  </div>
                )}
              </div>

              {/* 相关信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">相关信息</h3>
                
                {photo.relatedPeople && photo.relatedPeople.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">相关人物</dt>
                    <dd className="flex flex-wrap gap-2">
                      {photo.relatedPeople.map((person, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          👤 {person}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {photo.tags && photo.tags.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">标签</dt>
                    <dd className="flex flex-wrap gap-2">
                      {photo.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {photo.projectId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">关联项目</dt>
                    <dd className="text-sm text-gray-900">
                      <button className="text-blue-600 hover:text-blue-800">
                        查看项目 →
                      </button>
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* 照片质量信息 */}
            {photo.quality && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">照片质量分析</h3>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">质量评分:</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          photo.quality.score >= 80 ? 'bg-green-500' :
                          photo.quality.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${photo.quality.score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium ml-2">{photo.quality.score}/100</span>
                  </div>
                </div>

                {photo.quality.issues && photo.quality.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">检测到的问题:</h4>
                    <div className="space-y-1">
                      {photo.quality.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            issue.severity === 'high' ? 'bg-red-500' :
                            issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}></span>
                          {issue.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 原始照片对比 */}
            {photo.originalUrl && photo.enhancedUrl && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">修复前后对比</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">修复前</h4>
                    <img
                      src={photo.originalUrl}
                      alt="修复前"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">修复后</h4>
                    <img
                      src={photo.enhancedUrl}
                      alt="修复后"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}