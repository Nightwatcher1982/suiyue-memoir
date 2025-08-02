'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import type { Chapter } from '@/types';

interface ChapterManagerProps {
  chapters: Chapter[];
  currentChapterId?: string;
  onChapterSelect: (chapter: Chapter) => void;
  onChapterCreate: (title: string) => void;
  onChapterUpdate: (id: string, updates: Partial<Chapter>) => void;
  onChapterDelete: (id: string) => void;
  onChapterReorder: (chapters: Chapter[]) => void;
}

export function ChapterManager({
  chapters,
  currentChapterId,
  onChapterSelect,
  onChapterCreate,
  onChapterUpdate,
  onChapterDelete: _onChapterDelete, // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChapterReorder: _onChapterReorder, // eslint-disable-next-line @typescript-eslint/no-unused-vars
}: ChapterManagerProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused1 = _onChapterDelete;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused2 = _onChapterReorder;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreateChapter = () => {
    if (newChapterTitle.trim()) {
      onChapterCreate(newChapterTitle.trim());
      setNewChapterTitle('');
      setShowCreateForm(false);
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter.id);
    setEditTitle(chapter.title);
  };

  const handleSaveEdit = () => {
    if (editingChapter && editTitle.trim()) {
      onChapterUpdate(editingChapter, { title: editTitle.trim() });
      setEditingChapter(null);
      setEditTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setEditTitle('');
  };

  const getChapterWordCount = (content: string) => {
    // 简单的字数统计，移除HTML标签
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">章节管理</h3>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="text-xs"
          >
            + 新章节
          </Button>
        </div>
      </div>

      {/* 创建章节表单 */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="输入章节标题..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleCreateChapter}
                disabled={!newChapterTitle.trim()}
              >
                创建
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewChapterTitle('');
                }}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 章节列表 */}
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="mb-2">📝</div>
            <p className="text-sm">还没有章节</p>
                         <p className="text-xs mt-1">点击&ldquo;新章节&rdquo;开始创建</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {chapters.map((chapter, index) => {
              // 确保每个章节都有有效的ID，否则使用index作为fallback
              const chapterKey = chapter.id || `chapter-${index}`;
              console.log('🔍 渲染章节:', chapter.title, 'ID:', chapter.id, 'Key:', chapterKey);
              
              return (
                <div
                  key={chapterKey}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-colors border',
                    currentChapterId === chapter.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                  onClick={() => onChapterSelect(chapter)}
                >
                  {editingChapter === chapter.id ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex space-x-1">
                        <Button size="sm" onClick={handleSaveEdit} className="text-xs py-1">
                          保存
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} className="text-xs py-1">
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-medium">
                              第{index + 1}章
                            </span>
                            {currentChapterId === chapter.id && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 truncate mt-1">
                            {chapter.title}
                          </h4>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span>{getChapterWordCount(chapter.content)} 字</span>
                            <span>{formatDate(chapter.updatedAt)}</span>
                          </div>
                        </div>
                        
                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditChapter(chapter);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            ✏️
                          </button>
                        </div>
                      </div>

                      {/* 章节状态指示器 */}
                      <div className="mt-2 flex items-center space-x-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          chapter.content && chapter.content.length > 100
                            ? 'bg-green-400'
                            : chapter.content && chapter.content.length > 0
                            ? 'bg-yellow-400'
                            : 'bg-gray-300'
                        )}></div>
                        <span className="text-xs text-gray-500">
                          {chapter.content && chapter.content.length > 100
                            ? '已完成'
                            : chapter.content && chapter.content.length > 0
                            ? '进行中'
                            : '未开始'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>总章节数:</span>
            <span className="font-medium">{chapters.length}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>总字数:</span>
            <span className="font-medium">
              {chapters.reduce((total, chapter) => total + getChapterWordCount(chapter.content), 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 