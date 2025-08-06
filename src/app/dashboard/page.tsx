'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { databaseService } from '@/lib/cloudbase/database';
import { LoginModal } from '@/components/auth/LoginModal';
import { CreateProjectModal } from '@/components/memoir/CreateProjectModal';
import { WorkflowGuide } from '@/components/memoir/WorkflowGuide';
import { Button } from '@/components/ui/Button';
import type { MemoirProject } from '@/types';
import { generateId } from '@/lib/utils';

function DashboardContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<MemoirProject[]>([]);
  const [stats, setStats] = useState({
    projectCount: 0,
    chapterCount: 0,
    totalWords: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载用户项目数据
  const loadUserData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    setError('');

    try {
      // 并行加载项目数据和统计信息  
      console.log('📖 开始加载用户项目数据...');
      const userProjects = await databaseService.getUserProjects(user.id);
      console.log('📊 开始加载用户统计数据...');
      const userStats = await databaseService.getUserStats(user.id);

      // 确保项目唯一性，避免重复key错误
      const uniqueProjects = userProjects.filter((project, index, arr) => 
        arr.findIndex(p => p.id === project.id) === index
      );
      setProjects(uniqueProjects);
      setStats(userStats);
    } catch (error) {
      console.error('❌ 加载用户数据失败:', error);
      
      // 不再使用模拟数据，直接显示错误
      setProjects([]);
      setStats({
        projectCount: 0,
        chapterCount: 0,
        totalWords: 0,
      });
      
      setError(`数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // 用户登录状态变化时加载数据
  useEffect(() => {
    console.log('🔍 Dashboard用户状态检查:', { user: !!user, loading, userInfo: user });
    
    if (user) {
      console.log('✅ 用户已登录，加载工作台数据:', user);
      setShowLoginModal(false); // 确保关闭登录框
      loadUserData();
    } else if (!loading) {
      console.log('❌ 用户未登录，显示登录框');
      setShowLoginModal(true);
    }
  }, [user, loading, loadUserData]);

  // 添加额外的用户状态监听以确保及时响应状态变化
  useEffect(() => {
    const handleUserChange = () => {
      const savedUser = localStorage.getItem('suiyue_user');
      if (savedUser && !user) {
        console.log('🔄 检测到本地用户数据但当前状态为空，触发重新检查');
        // 触发重新检查认证状态
        window.location.reload();
      }
    };

    // 延迟检查以确保所有状态都已稳定
    const timeoutId = setTimeout(handleUserChange, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  // 创建新项目
  const handleCreateProject = async (projectData: {
    title: string;
    description: string;
    coverStyle: string;
  }) => {
    if (!user) return;

    console.log('🚀 开始创建项目:', projectData);

    try {
      // 尝试使用真实数据库创建项目
      console.log('📝 调用数据库服务创建项目...');
      const projectId = await databaseService.createProject({
        userId: user.id,
        title: projectData.title,
        description: projectData.description,
        coverStyle: projectData.coverStyle,
        status: 'active',
        wordCount: 0,
        chapterCount: 0,
      });

      console.log('✅ 项目创建成功，ID:', projectId);

      // 刷新项目列表
      console.log('🔄 刷新项目列表...');
      await loadUserData();
      setShowCreateModal(false);

      console.log('🎯 跳转到编辑器...');
      // 跳转到编辑器
      window.location.href = `/editor/${projectId}`;
    } catch (error) {
      console.error('❌ 创建项目失败:', error);
      setError(`创建项目失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    if (!user || !confirm('确定要删除这个项目吗？此操作不可恢复。')) return;

    try {
      await databaseService.deleteProject(projectId);
      await loadUserData(); // 重新加载数据
    } catch (error) {
      console.error('❌ 删除项目失败:', error);
      setError(`删除项目失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => router.push('/')}
              >
                岁阅
              </h1>
              <span className="ml-2 text-sm text-gray-500">我的工作台</span>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    欢迎，{user.nickname}
                  </span>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.nickname?.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-medium">📖</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">我的项目</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.projectCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-medium">📝</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总章节数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.chapterCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-medium">✍️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总字数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalWords.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 工作流引导 */}
        <div className="mb-8">
          <WorkflowGuide 
            onCreateProject={() => setShowCreateModal(true)}
            className={projects.length === 0 ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
            autoExpand={projects.length === 0}
          />
        </div>

        {/* 项目列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">我的回忆录项目</h2>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/photos'}
                >
                  📸 照片档案
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/photo-materials'}
                >
                  🔧 照片修复
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  ➕ 新建项目
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {dataLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">加载项目数据中...</p>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900 truncate">
                        {project.title}
                      </h3>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      <div className="flex justify-between">
                        <span>{project.wordCount.toLocaleString()} 字</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                          {project.status === 'active' ? '进行中' : 
                           project.status === 'completed' ? '已完成' : 
                           project.status === 'writing' ? '写作中' : '草稿'}
                        </span>
                      </div>
                      <div className="mt-1">
                        最后更新：{project.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/editor/${project.id}`}
                      className="w-full"
                    >
                      写作
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  还没有回忆录项目
                </h3>
                <p className="text-gray-500 mb-6">
                  创建您的第一个回忆录，开始记录珍贵的人生故事
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  创建我的第一个回忆录
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          console.log('🎉 工作台登录成功，关闭登录框');
          setShowLoginModal(false);
        }}
      />
      
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
} 