'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { ChapterManager } from '@/components/memoir/ChapterManager';
import { EditorWithUpload } from '@/components/editor/EditorWithUpload';
import { generateId, debounce } from '@/lib/utils';
import type { MemoirProject, Chapter } from '@/types';

export default function TestChaptersPage() {
  const { user } = useAuth();
  const [testProjectId] = useState('test-chapters-' + generateId());
  const [project, setProject] = useState<MemoirProject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 日志函数
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setTestLog(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  // 初始化测试项目
  useEffect(() => {
    if (!user) return;

    const initTestProject = () => {
      const testProject: MemoirProject = {
        id: testProjectId,
        userId: user.id,
        title: '章节测试项目',
        description: '用于测试章节创建和编辑功能',
        status: 'writing',
        wordCount: 0,
        chapterCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setProject(testProject);
      addLog('测试项目已初始化', 'success');
      
      // 创建第一个测试章节
      const firstChapter: Chapter = {
        id: generateId(),
        projectId: testProjectId,
        title: '第一章',
        content: '<p>这是第一章的初始内容</p>',
        order: 1,
        photos: [],
        audioRecordings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setChapters([firstChapter]);
      setCurrentChapter(firstChapter);
      addLog('第一章已创建，ID: ' + firstChapter.id, 'success');
    };

    initTestProject();
  }, [user, testProjectId]);

  // 自动保存功能
  const autoSave = debounce(async (chapterId: string, content: string) => {
    if (!chapterId || typeof chapterId !== 'string' || !chapterId.trim()) {
      addLog('自动保存失败：章节ID无效 - ' + chapterId, 'error');
      return;
    }

    setIsSaving(true);
    addLog(`开始自动保存章节: ${chapterId}, 内容长度: ${content.length}`, 'info');
    
    try {
      // 模拟数据库保存
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 更新本地状态
      setChapters(prev => 
        prev.map(chapter => 
          chapter.id === chapterId 
            ? { ...chapter, content, updatedAt: new Date() }
            : chapter
        )
      );
      
      addLog(`自动保存成功: ${chapterId}`, 'success');
    } catch (error) {
      addLog(`自动保存失败: ${error}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, 2000);

  // 内容变化处理
  const handleContentChange = (content: string) => {
    if (!currentChapter) {
      addLog('内容变化处理失败：没有当前章节', 'warning');
      return;
    }

    addLog(`内容变化: 章节ID=${currentChapter.id}, 新内容长度=${content.length}`, 'info');
    
    // 立即更新当前章节状态
    setCurrentChapter({ ...currentChapter, content });
    
    // 检查章节ID是否有效
    if (currentChapter.id && typeof currentChapter.id === 'string' && currentChapter.id.trim()) {
      addLog(`准备自动保存，章节ID: ${currentChapter.id}`, 'info');
      autoSave(currentChapter.id, content);
    } else {
      addLog(`章节ID无效，跳过自动保存: ${currentChapter.id}`, 'warning');
    }
  };

  // 章节选择处理
  const handleChapterSelect = (chapter: Chapter) => {
    addLog(`切换到章节: ${chapter.title} (ID: ${chapter.id})`, 'info');
    setCurrentChapter(chapter);
  };

  // 创建章节处理
  const handleChapterCreate = async (title: string) => {
    addLog(`开始创建新章节: "${title}"`, 'info');
    
    try {
      const newChapterId = generateId();
      const newChapter: Chapter = {
        id: newChapterId,
        projectId: testProjectId,
        title,
        content: `<p>这是"${title}"的初始内容</p>`,
        order: chapters.length + 1,
        photos: [],
        audioRecordings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 模拟数据库创建延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setChapters(prev => [...prev, newChapter]);
      setCurrentChapter(newChapter);
      
      addLog(`新章节创建成功: "${title}" (ID: ${newChapterId})`, 'success');
    } catch (error) {
      addLog(`创建章节失败: ${error}`, 'error');
    }
  };

  // 章节更新处理
  const handleChapterUpdate = async (id: string, updates: Partial<Chapter>) => {
    addLog(`更新章节: ${id}, 更新内容: ${JSON.stringify(updates)}`, 'info');
    
    try {
      // 模拟数据库更新
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setChapters(prev =>
        prev.map(chapter =>
          chapter.id === id
            ? { ...chapter, ...updates, updatedAt: new Date() }
            : chapter
        )
      );
      
      if (currentChapter?.id === id) {
        setCurrentChapter(prev => prev ? { ...prev, ...updates } : null);
      }
      
      addLog(`章节更新成功: ${id}`, 'success');
    } catch (error) {
      addLog(`章节更新失败: ${error}`, 'error');
    }
  };

  // 自动测试函数
  const runAutoTest = async () => {
    addLog('开始自动测试', 'info');
    
    // 测试1：创建第二章
    await new Promise(resolve => setTimeout(resolve, 1000));
    await handleChapterCreate('第二章');
    
    // 测试2：在第二章中添加内容
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleContentChange('<p>这是第二章的测试内容，用于验证编辑功能</p>');
    
    // 测试3：切换回第一章
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (chapters.length > 0) {
      handleChapterSelect(chapters[0]);
    }
    
    // 测试4：在第一章中修改内容
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleContentChange('<p>这是第一章的更新内容，验证章节切换后编辑是否正常</p>');
    
    addLog('自动测试完成', 'success');
  };

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <p>需要登录后才能进行章节测试</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">章节功能测试</h1>
            <p className="text-sm text-gray-500">测试章节创建、编辑和切换功能</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={runAutoTest} size="sm">
              运行自动测试
            </Button>
            <Button 
              onClick={() => setTestLog([])} 
              variant="outline" 
              size="sm"
            >
              清空日志
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 章节管理器 */}
        <ChapterManager
          chapters={chapters}
          currentChapterId={currentChapter?.id}
          onChapterSelect={handleChapterSelect}
          onChapterCreate={handleChapterCreate}
          onChapterUpdate={handleChapterUpdate}
          onChapterDelete={() => {}}
          onChapterReorder={() => {}}
        />

        {/* 主要内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 编辑器区域 */}
          <div className="flex-1 flex flex-col">
            {/* 当前章节信息 */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {currentChapter ? currentChapter.title : '请选择章节'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    章节ID: {currentChapter?.id || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  {isSaving ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-600">保存中...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-600">已保存</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 编辑器 */}
            <div className="flex-1 p-6 overflow-y-auto">
              {currentChapter ? (
                <div className="max-w-4xl mx-auto">
                  <EditorWithUpload
                    content={currentChapter.content}
                    onChange={handleContentChange}
                    placeholder={`开始编辑"${currentChapter.title}"...`}
                    className="bg-white shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-lg">请选择一个章节开始编辑</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 测试日志区域 */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">测试日志</h3>
              <p className="text-sm text-gray-500">实时显示测试过程</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1 font-mono text-xs">
                {testLog.map((log, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded ${
                      log.includes('ERROR') ? 'bg-red-50 text-red-800' :
                      log.includes('SUCCESS') ? 'bg-green-50 text-green-800' :
                      log.includes('WARNING') ? 'bg-yellow-50 text-yellow-800' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}