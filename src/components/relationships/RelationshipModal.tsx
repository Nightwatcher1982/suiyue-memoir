'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { Person, Relationship, RelationshipType } from '@/types/relationship';

interface RelationshipModalProps {
  isOpen: boolean;
  relationship?: Relationship;
  people: Person[];
  fromPersonId?: string;
  toPersonId?: string;
  onClose: () => void;
  onSave: (relationshipData: Partial<Relationship>) => void;
  onDelete?: (relationshipId: string) => void;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; category: string }[] = [
  // 血缘关系
  { value: 'parent', label: '父/母', category: '血缘关系' },
  { value: 'child', label: '子/女', category: '血缘关系' },
  { value: 'sibling', label: '兄弟姐妹', category: '血缘关系' },
  { value: 'spouse', label: '配偶', category: '血缘关系' },
  { value: 'grandparent', label: '祖父母/外祖父母', category: '血缘关系' },
  { value: 'grandchild', label: '孙子女/外孙子女', category: '血缘关系' },
  { value: 'uncle', label: '叔伯/舅舅', category: '血缘关系' },
  { value: 'aunt', label: '姑姑/阿姨', category: '血缘关系' },
  { value: 'cousin', label: '堂/表兄弟姐妹', category: '血缘关系' },
  { value: 'nephew', label: '侄子', category: '血缘关系' },
  { value: 'niece', label: '侄女', category: '血缘关系' },
  { value: 'in-law', label: '姻亲', category: '血缘关系' },
  
  // 社会关系
  { value: 'friend', label: '朋友', category: '社会关系' },
  { value: 'colleague', label: '同事', category: '社会关系' },
  { value: 'neighbor', label: '邻居', category: '社会关系' },
  { value: 'teacher', label: '老师', category: '社会关系' },
  { value: 'student', label: '学生', category: '社会关系' },
  { value: 'mentor', label: '导师', category: '社会关系' },
  { value: 'protege', label: '学徒', category: '社会关系' },
  { value: 'partner', label: '伙伴', category: '社会关系' },
  { value: 'acquaintance', label: '熟人', category: '社会关系' },
  { value: 'other', label: '其他', category: '其他' },
];

export function RelationshipModal({
  isOpen,
  relationship,
  people,
  fromPersonId,
  toPersonId,
  onClose,
  onSave,
  onDelete,
}: RelationshipModalProps) {
  const [formData, setFormData] = useState({
    fromPersonId: '',
    toPersonId: '',
    type: 'friend' as RelationshipType,
    description: '',
    startDate: '',
    endDate: '',
    isClose: false,
  });
  const [sharedMemories, setSharedMemories] = useState<string[]>([]);
  const [currentMemory, setCurrentMemory] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (relationship) {
        // 编辑模式
        setFormData({
          fromPersonId: relationship.fromPersonId,
          toPersonId: relationship.toPersonId,
          type: relationship.type,
          description: relationship.description || '',
          startDate: relationship.startDate ? relationship.startDate.toISOString().split('T')[0] : '',
          endDate: relationship.endDate ? relationship.endDate.toISOString().split('T')[0] : '',
          isClose: relationship.isClose || false,
        });
        setSharedMemories(relationship.sharedMemories || []);
      } else {
        // 新建模式
        setFormData({
          fromPersonId: fromPersonId || '',
          toPersonId: toPersonId || '',
          type: 'friend',
          description: '',
          startDate: '',
          endDate: '',
          isClose: false,
        });
        setSharedMemories([]);
      }
      setCurrentMemory('');
    }
  }, [isOpen, relationship, fromPersonId, toPersonId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMemory = () => {
    if (currentMemory.trim()) {
      setSharedMemories(prev => [...prev, currentMemory.trim()]);
      setCurrentMemory('');
    }
  };

  const handleRemoveMemory = (index: number) => {
    setSharedMemories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formData.fromPersonId || !formData.toPersonId) {
      alert('请选择相关人物');
      return;
    }

    if (formData.fromPersonId === formData.toPersonId) {
      alert('不能选择同一个人');
      return;
    }

    const relationshipData: Partial<Relationship> = {
      fromPersonId: formData.fromPersonId,
      toPersonId: formData.toPersonId,
      type: formData.type,
      description: formData.description.trim() || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      isClose: formData.isClose,
      sharedMemories: sharedMemories.length > 0 ? sharedMemories : undefined,
    };

    onSave(relationshipData);
  };

  const handleDelete = () => {
    if (relationship && onDelete) {
      if (confirm('确定要删除这个关系吗？此操作无法撤销。')) {
        onDelete(relationship.id);
      }
    }
  };

  // 获取可选择的人物（排除已选择的）
  const getAvailablePeople = (excludeId?: string) => {
    return people.filter(person => person.id !== excludeId);
  };

  const getPersonName = (personId: string) => {
    const person = people.find(p => p.id === personId);
    return person ? person.name : '未知';
  };

  // 按分类分组关系选项
  const groupedRelationships = RELATIONSHIP_OPTIONS.reduce((groups, option) => {
    const category = option.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(option);
    return groups;
  }, {} as Record<string, typeof RELATIONSHIP_OPTIONS>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {relationship ? '编辑关系' : '添加新关系'}
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
            {/* 关系双方 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关系起点 *
                </label>
                <select
                  value={formData.fromPersonId}
                  onChange={(e) => handleInputChange('fromPersonId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!fromPersonId} // 如果是从特定人物添加关系，则不可修改
                >
                  <option value="">选择人物</option>
                  {getAvailablePeople(formData.toPersonId).map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关系终点 *
                </label>
                <select
                  value={formData.toPersonId}
                  onChange={(e) => handleInputChange('toPersonId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!toPersonId} // 如果是从特定人物添加关系，则不可修改
                >
                  <option value="">选择人物</option>
                  {getAvailablePeople(formData.fromPersonId).map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 关系预览 */}
            {formData.fromPersonId && formData.toPersonId && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <span className="font-medium text-blue-900">
                    {getPersonName(formData.fromPersonId)}
                  </span>
                  <span className="mx-3 text-blue-600">→</span>
                  <span className="font-medium text-blue-900">
                    {getPersonName(formData.toPersonId)}
                  </span>
                </div>
              </div>
            )}

            {/* 关系类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关系类型 *
              </label>
              <div className="space-y-3">
                {Object.entries(groupedRelationships).map(([category, options]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">{category}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {options.map(option => (
                        <label
                          key={option.value}
                          className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${
                            formData.type === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="relationshipType"
                            value={option.value}
                            checked={formData.type === option.value}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="sr-only"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 关系设置 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isClose"
                checked={formData.isClose}
                onChange={(e) => handleInputChange('isClose', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isClose" className="text-sm font-medium text-gray-700">
                亲密关系（在地图上显示更粗的连线）
              </label>
            </div>

            {/* 时间范围 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关系开始时间
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关系结束时间
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 关系描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关系描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="描述这段关系的特点或背景..."
              />
            </div>

            {/* 共同回忆 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                共同回忆
              </label>
              
              {/* 已添加的回忆 */}
              {sharedMemories.length > 0 && (
                <div className="space-y-2 mb-3">
                  {sharedMemories.map((memory, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-md">
                      <div className="flex-1 text-sm text-gray-700">
                        {memory}
                      </div>
                      <button
                        onClick={() => handleRemoveMemory(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加新回忆 */}
              <div className="space-y-2">
                <textarea
                  value={currentMemory}
                  onChange={(e) => setCurrentMemory(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="记录与这段关系相关的共同回忆..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddMemory}
                  disabled={!currentMemory.trim()}
                >
                  添加回忆
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {relationship && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                删除关系
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
              disabled={!formData.fromPersonId || !formData.toPersonId}
            >
              {relationship ? '保存修改' : '添加关系'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}