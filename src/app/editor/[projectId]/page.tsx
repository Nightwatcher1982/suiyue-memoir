'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';
import { authPersistence } from '@/lib/auth-persistence';
import { EditorWithUpload } from '@/components/editor/EditorWithUpload';
import { PDFExporter } from '@/components/editor/PDFExporter';
import { ChapterManager } from '@/components/memoir/ChapterManager';
import { formatDate, generateId, debounce } from '@/lib/utils';
import type { MemoirProject, Chapter } from '@/types';
// 数据库服务使用动态导入

interface EditorPageProps {
  params: Promise<{
    projectId: string;
  }>;
}


function EditorContent({ params }: EditorPageProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // 尝试从持久化系统立即获取用户状态以减少等待时间
  const [initialUser, setInitialUser] = useState(() => {
    if (typeof window !== 'undefined') {
      return authPersistence.getUser();
    }
    return null;
  });
  
  // 使用优先用户状态（优先使用auth hook的状态，fallback到初始状态）
  const currentUser = user || initialUser;
  
  // 立即尝试获取用户状态，不依赖React hooks的初始化时机
  const [clientInitialized, setClientInitialized] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !clientInitialized) {
      setClientInitialized(true);
      // 强制同步获取用户状态
      const persistedUser = authPersistence.getUser();
      if (persistedUser && !user && !initialUser) {
        setInitialUser(persistedUser);
        console.log('🔧 强制同步获取到持久化用户:', persistedUser);
      }
    }
  }, [clientInitialized, user, initialUser]);
  
  // 添加调试信息
  console.log('🔍 EditorContent 组件渲染，user:', user, 'initialUser:', initialUser, 'currentUser:', currentUser, 'loading:', loading, 'clientInitialized:', clientInitialized);
  console.log('🔍 EditorContent params:', params);
  const [project, setProject] = useState<MemoirProject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPDFExporter, setShowPDFExporter] = useState(false);

  // 同步initialUser状态
  useEffect(() => {
    if (user && !initialUser) {
      setInitialUser(user);
    }
  }, [user, initialUser]);

  // 从数据库加载数据
  useEffect(() => {
    console.log('🔍 编辑页面 useEffect 触发，currentUser:', currentUser ? '已登录' : '未登录', 'loading:', loading);
    
    // 如果还在加载中且没有用户状态，并且客户端还未初始化，等待完成
    if (loading && !currentUser && !clientInitialized) {
      console.log('⏳ 用户状态加载中，等待完成...');
      return;
    }
    
    // 如果加载完成但用户未登录，显示登录提示
    if (!currentUser) {
      console.log('⚠️ 用户未登录');
      return;
    }

    console.log('✅ 用户已登录，开始加载数据，用户ID:', currentUser.id);
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        
        // 首先确保CloudBase认证状态
        console.log('🔐 确保CloudBase认证状态...');
        try {
          const { authService } = await import('@/lib/cloudbase/auth');
          
          // 检查当前认证状态
          const isAuth = authService.isAuthenticated();
          console.log('🔍 当前CloudBase认证状态:', isAuth);
          
          if (!isAuth) {
            console.log('🔄 尝试建立CloudBase认证...');
            const cloudbaseUser = await authService.ensureAuthenticated();
            console.log('✅ CloudBase认证成功:', cloudbaseUser ? '已认证' : '认证失败');
            
            if (!cloudbaseUser) {
              throw new Error('CloudBase认证失败');
            }
          } else {
            console.log('✅ CloudBase已认证');
          }
        } catch (authError) {
          console.error('❌ CloudBase认证完全失败:', authError);
          // 认证失败时清除本地状态并重定向
          const { authPersistence } = await import('@/lib/auth-persistence');
          authPersistence.clearUser();
          alert('认证失败，请重新登录');
          window.location.href = '/';
          return;
        }
        
        console.log('📦 开始动态导入数据库服务...');
        const { databaseService } = await import('@/lib/cloudbase/database');
        console.log('✅ 数据库服务导入成功');
        
        console.log('📖 加载项目数据，projectId:', resolvedParams.projectId);
        
        // 尝试从数据库加载项目
        let loadedProject: MemoirProject | null = null;
        let loadedChapters: Chapter[] = [];
        
        try {
          loadedProject = await databaseService.getProjectById(resolvedParams.projectId);
          loadedChapters = await databaseService.getProjectChapters(resolvedParams.projectId);
          console.log('✅ 成功从数据库加载项目和章节');
        } catch (error: any) {
          console.error('❌ 数据库加载失败:', error);
          
          // 如果是认证错误，提示用户重新登录
          if (error.message?.includes('auth') || error.message?.includes('request without auth')) {
            console.error('🔐 CloudBase认证失败，项目访问被拒绝');
            alert('认证已过期，请重新登录');
            // 清除本地用户状态并跳转到首页
            const { authPersistence } = await import('@/lib/auth-persistence');
            authPersistence.clearUser();
            window.location.href = '/';
            return;
          }
          
          throw error; // 重新抛出其他错误
        }
        
        // 如果数据库中没有项目，创建一个基础项目
        if (!loadedProject) {
          console.log('📝 项目不存在，创建基础项目:', resolvedParams.projectId);
          
          const newProject: MemoirProject = {
            id: resolvedParams.projectId,
            userId: currentUser.id,
            title: '新建回忆录',
            description: '记录我的人生故事',
            status: 'writing',
            wordCount: 0,
            chapterCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          try {
            // 尝试保存项目到数据库
            await databaseService.createProject({
              userId: newProject.userId,
              title: newProject.title,
              description: newProject.description,
              status: newProject.status,
              wordCount: newProject.wordCount,
              chapterCount: newProject.chapterCount,
            });
            console.log('✅ 基础项目已创建并保存到数据库');
          } catch (error) {
            console.warn('⚠️ 保存基础项目到数据库失败，仅使用本地状态:', error);
          }
          
          loadedProject = newProject;
        }

        setProject(loadedProject);
        
        // 确保章节唯一性，避免重复key错误，并为没有ID的章节生成ID
        const uniqueChapters = loadedChapters
          .map((chapter, index) => ({
            ...chapter,
            id: chapter.id || generateId(), // 为没有ID的章节生成ID
          }))
          .filter((chapter, index, arr) => 
            arr.findIndex(c => c.id === chapter.id) === index
          );
        
        console.log('📖 处理后的章节数据:', uniqueChapters);
        setChapters(uniqueChapters);
        
        // 如果没有章节，创建默认章节
        if (uniqueChapters.length === 0) {
          console.log('📝 没有章节，创建默认章节');
          
          const defaultChapter = {
            projectId: resolvedParams.projectId,
            title: '第一章',
            content: '',
            order: 1,
            photos: [],
            audioRecordings: [],
          };
          
          try {
            const chapterId = await databaseService.createChapter(defaultChapter);
            const newChapter: Chapter = {
              ...defaultChapter,
              id: chapterId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            setChapters([newChapter]);
            setCurrentChapter(newChapter);
            console.log('✅ 默认章节已创建:', chapterId);
            return; // 早期返回，避免后续设置
          } catch (error) {
            console.warn('⚠️ 创建默认章节失败，创建本地临时章节:', error);
            // 如果数据库创建失败，创建一个带临时ID的本地章节
            const tempChapterId = generateId();
            const tempChapter: Chapter = {
              ...defaultChapter,
              id: tempChapterId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            setChapters([tempChapter]);
            setCurrentChapter(tempChapter);
            console.log('✅ 临时默认章节已创建:', tempChapterId);
            return; // 早期返回，避免后续设置
          }
        }
        
        setChapters(uniqueChapters);
        
        // 默认选择第一章
        if (uniqueChapters.length > 0) {
          setCurrentChapter(uniqueChapters[0]);
        }
        
      } catch (error) {
        console.error('❌ 加载数据时发生错误:', error);
      }
    };

    loadData();
  }, [currentUser, loading, params, clientInitialized]);

  // 自动保存功能
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autoSave = useCallback(
    debounce(async (chapterId: string, content: string) => {
      setIsSaving(true);
      console.log('💾 开始自动保存章节:', chapterId, '内容长度:', content.length);
      
      try {
        // 尝试保存到数据库
        console.log('📦 开始动态导入数据库服务...');
        const { databaseService } = await import('@/lib/cloudbase/database');
        console.log('✅ 数据库服务导入成功');
        await databaseService.updateChapter(chapterId, { content });
        
        // 更新项目统计信息
        const resolvedParams = await params;
        await databaseService.updateProjectStats(resolvedParams.projectId);
        
        console.log('✅ 自动保存成功，项目统计已更新');
        
        setChapters(prev => 
          prev.map(chapter => 
            chapter.id === chapterId 
              ? { ...chapter, content, updatedAt: new Date() }
              : chapter
          )
        );
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('❌ 自动保存失败，使用本地缓存:', error);
        
        // 如果数据库保存失败，至少更新本地状态
        setChapters(prev => 
          prev.map(chapter => 
            chapter.id === chapterId 
              ? { ...chapter, content, updatedAt: new Date() }
              : chapter
          )
        );
        
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    []
  );

  const handleContentChange = (content: string) => {
    if (currentChapter) {
      setCurrentChapter({ ...currentChapter, content });
      
      // 确保章节ID有效才进行自动保存
      if (currentChapter.id && typeof currentChapter.id === 'string' && currentChapter.id.trim()) {
        console.log('🔍 准备自动保存，章节ID:', currentChapter.id, '类型:', typeof currentChapter.id);
        autoSave(currentChapter.id, content);
      } else {
        console.warn('⚠️ 章节ID无效，跳过自动保存:', currentChapter.id);
      }
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setCurrentChapter(chapter);
  };

  const handleChapterCreate = async (title: string) => {
    const resolvedParams = await params;
    
    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      
      // 创建章节数据（不包含id，让数据库生成）
      const chapterData = {
        projectId: resolvedParams.projectId,
        title,
        content: '',
        order: chapters.length + 1,
        photos: [],
        audioRecordings: [],
      };
      
      console.log('📝 创建章节数据:', chapterData);
      const newChapterId = await databaseService.createChapter(chapterData);
      console.log('✅ 章节已保存到数据库，ID:', newChapterId);
      
      // 构建完整的章节对象
      const newChapter: Chapter = {
        ...chapterData,
        id: newChapterId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 更新项目统计信息
      await databaseService.updateProjectStats(resolvedParams.projectId);
      
      setChapters(prev => [...prev, newChapter]);
      setCurrentChapter(newChapter);
    } catch (error) {
      console.error('❌ 创建章节失败:', error);
      throw error;
    }
  };

  const handleChapterUpdate = async (id: string, updates: Partial<Chapter>) => {
    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      await databaseService.updateChapter(id, updates);
      console.log('✅ 章节已更新到数据库:', id);
      
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
    } catch (error) {
      console.error('❌ 更新章节失败:', error);
      throw error;
    }
  };

  const handleChapterDelete = async (id: string) => {
    if (chapters.length <= 1) {
      alert('至少需要保留一个章节');
      return;
    }
    
    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      await databaseService.deleteChapter(id);
      console.log('✅ 章节已从数据库删除:', id);
      
      setChapters(prev => prev.filter(chapter => chapter.id !== id));
      
      if (currentChapter?.id === id) {
        const remainingChapters = chapters.filter(chapter => chapter.id !== id);
        setCurrentChapter(remainingChapters[0] || null);
      }
    } catch (error) {
      console.error('❌ 删除章节失败:', error);
      throw error;
    }
  };

  const handleChapterReorder = (reorderedChapters: Chapter[]) => {
    setChapters(reorderedChapters);
  };

  // 如果还在加载用户状态且没有用户且客户端未初始化，显示加载界面
  if ((loading && !currentUser && !clientInitialized) || (!clientInitialized && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录，显示登录提示
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录后才能访问编辑器</p>
          <Button onClick={() => router.push('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载项目中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              ← 返回工作台
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
              <p className="text-sm text-gray-500">{project.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 保存状态指示器 */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span>保存中...</span>
                </>
              ) : lastSaved ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>已保存 {formatDate(lastSaved)}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>未保存</span>
                </>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPDFExporter(!showPDFExporter)}
            >
              📄 PDF导出
            </Button>
            <Button variant="outline" size="sm">
              预览
            </Button>
            <Button size="sm">
              发布
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 章节管理侧边栏 */}
        <ChapterManager
          chapters={chapters}
          currentChapterId={currentChapter?.id}
          onChapterSelect={handleChapterSelect}
          onChapterCreate={handleChapterCreate}
          onChapterUpdate={handleChapterUpdate}
          onChapterDelete={handleChapterDelete}
          onChapterReorder={handleChapterReorder}
        />

        {/* 编辑器区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* PDF导出器 */}
          {showPDFExporter && (
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <PDFExporter 
                project={project}
                chapters={chapters}
              />
            </div>
          )}

          {currentChapter ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* 章节标题 */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentChapter.title}
                  </h2>
                  <div className="text-sm text-gray-500">
                    最后编辑: {formatDate(currentChapter.updatedAt)}
                  </div>
                </div>

                {/* 富文本编辑器with照片上传 */}
                <EditorWithUpload
                  content={currentChapter.content}
                  onChange={handleContentChange}
                  placeholder={`开始撰写"${currentChapter.title}"...`}
                  className="bg-white shadow-sm"
                  projectId={project.id}
                  chapterId={currentChapter.id}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-lg">选择一个章节开始写作</p>
                <p className="text-sm mt-2">或者创建一个新章节</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditorPage(props: EditorPageProps) {
  return <EditorContent {...props} />;
} 