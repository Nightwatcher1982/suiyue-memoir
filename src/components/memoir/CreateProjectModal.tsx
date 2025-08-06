'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn, generateId } from '@/lib/utils';
import type { MemoirProject } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: {
    title: string;
    description: string;
  }) => Promise<void>;
  onSuccess?: (project: MemoirProject) => void;
}


export function CreateProjectModal({ isOpen, onClose, onSubmit, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});


  const handleSubmit = async () => {
    console.log('📝 模态框：开始提交项目创建...');
    
    // 验证表单
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入回忆录标题';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入回忆录描述';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // 调用父组件传入的onSubmit函数
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
      
      console.log('✅ 模态框：项目创建成功');
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('❌ 模态框：项目创建失败:', error);
      // 这里可以显示错误提示
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">创建新的回忆录</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        {/* 基本信息 */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回忆录标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：我的人生故事、家族回忆录..."
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.title ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回忆录描述 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简单描述一下这本回忆录的主要内容..."
                  rows={4}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.description ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              创建项目
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 