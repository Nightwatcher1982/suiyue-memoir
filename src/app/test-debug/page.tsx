'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TestDebugPage() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔍 TestDebugPage mounted');
    console.log('🔍 User:', user);
    console.log('🔍 Window object:', typeof window);
  }, [user]);

  const testDatabaseImport = async () => {
    try {
      console.log('📦 Testing database import...');
      const { databaseService } = await import('@/lib/cloudbase/database');
      console.log('✅ Database service imported:', databaseService);
      
      if (user) {
        console.log('📊 Testing getUserProjects...');
        const projects = await databaseService.getUserProjects(user.id);
        console.log('📊 Projects:', projects);
      } else {
        console.log('⚠️ User not logged in, testing with mock user');
        const projects = await databaseService.getUserProjects('test-user');
        console.log('📊 Projects:', projects);
      }
    } catch (error) {
      console.error('❌ Database test failed:', error);
    }
  };

  const testCreateProject = async () => {
    try {
      console.log('📝 Testing project creation...');
      const { databaseService } = await import('@/lib/cloudbase/database');
      
      const projectData = {
        userId: user?.id || 'test-user',
        title: '测试项目',
        description: '这是一个测试项目',
        status: 'active' as const,
        wordCount: 0,
        chapterCount: 0,
      };
      
      console.log('📝 Creating project:', projectData);
      const projectId = await databaseService.createProject(projectData);
      console.log('✅ Project created with ID:', projectId);
    } catch (error) {
      console.error('❌ Project creation failed:', error);
    }
  };

  return (
    <div className="p-8">
      <h1>Debug Test Page</h1>
      <p>User: {user ? user.nickname : 'Not logged in'}</p>
      <div className="space-y-4">
        <button 
          onClick={testDatabaseImport}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Database Import
        </button>
        <button 
          onClick={testCreateProject}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Create Project
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-600">Check browser console for detailed logs</p>
    </div>
  );
}