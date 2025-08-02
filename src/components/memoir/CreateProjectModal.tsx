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
    coverStyle: string;
  }) => Promise<void>;
  onSuccess?: (project: MemoirProject) => void;
}

// 预设封面选项
const coverOptions = [
  { id: 'classic', name: '经典风格', color: 'bg-gradient-to-br from-amber-400 to-orange-500' },
  { id: 'elegant', name: '优雅风格', color: 'bg-gradient-to-br from-purple-400 to-pink-500' },
  { id: 'modern', name: '现代风格', color: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
  { id: 'vintage', name: '复古风格', color: 'bg-gradient-to-br from-green-400 to-teal-500' },
  { id: 'warm', name: '温馨风格', color: 'bg-gradient-to-br from-red-400 to-pink-500' },
  { id: 'natural', name: '自然风格', color: 'bg-gradient-to-br from-emerald-400 to-lime-500' },
];

export function CreateProjectModal({ isOpen, onClose, onSubmit, onSuccess }: CreateProjectModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverStyle: coverOptions[0].id,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    // 验证第一步
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
    
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async () => {
    console.log('📝 模态框：开始提交项目创建...');
    
    try {
      // 调用父组件传入的onSubmit函数
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        coverStyle: formData.coverStyle,
      });
      
      console.log('✅ 模态框：项目创建成功');
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
        coverStyle: coverOptions[0].id,
      });
      setStep(1);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('❌ 模态框：项目创建失败:', error);
      // 这里可以显示错误提示
    }
  };

  const handleClose = () => {
    setStep(1);
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

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            )}>
              1
            </div>
            <div className={cn(
              "w-16 h-1",
              step >= 2 ? "bg-blue-600" : "bg-gray-200"
            )} />
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            )}>
              2
            </div>
          </div>
        </div>

        {/* 第一步：基本信息 */}
        {step === 1 && (
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
              <Button onClick={handleNext}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {/* 第二步：选择封面 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">选择封面风格</h3>
              <p className="text-gray-600 mb-6">选择一种您喜欢的封面风格，后续可以随时更改</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {coverOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "relative cursor-pointer rounded-lg border-2 transition-all",
                      formData.coverStyle === option.id
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setFormData({ ...formData, coverStyle: option.id })}
                  >
                    <div className={cn("w-full h-32 rounded-md", option.color)}>
                      <div className="flex items-center justify-center h-full">
                        <div className="text-white text-center">
                          <div className="text-xs font-medium mb-1">回忆录</div>
                          <div className="text-xs opacity-80">{formData.title || '标题'}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-center text-gray-700 mt-2 mb-3">
                      {option.name}
                    </p>
                    
                    {formData.coverStyle === option.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                上一步
              </Button>
              <div className="space-x-3">
                <Button variant="outline" onClick={handleClose}>
                  取消
                </Button>
                <Button onClick={handleSubmit}>
                  创建项目
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 