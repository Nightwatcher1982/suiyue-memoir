'use client';

import { useState } from 'react';
import { useAuthReal } from '@/hooks/useAuthReal';
import { databaseService } from '@/lib/cloudbase/database';

export default function TestPage() {
  const { user, loading, isClient } = useAuthReal();
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testDatabaseConnection = async () => {
    setIsTesting(true);
    setTestResult('正在测试数据库连接...');
    
    try {
      // 测试创建用户
      const userId = await databaseService.createUser({
        phone: 'test@example.com',
        nickname: '测试用户',
        avatar: '',
      });
      
      setTestResult(`✅ 数据库连接成功！创建用户ID: ${userId}`);
      
      // 清理测试数据
      setTimeout(async () => {
        try {
          await databaseService.deleteUser(userId);
          setTestResult(prev => prev + '\n✅ 测试数据清理完成');
        } catch (error) {
          setTestResult(prev => prev + '\n⚠️ 测试数据清理失败: ' + error);
        }
      }, 2000);
      
    } catch (error: any) {
      setTestResult(`❌ 数据库连接失败: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isClient) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CloudBase 服务测试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">认证状态</h2>
          <div className="space-y-2">
            <p><strong>客户端状态:</strong> {isClient ? '✅ 已加载' : '❌ 未加载'}</p>
            <p><strong>加载状态:</strong> {loading ? '🔄 加载中' : '✅ 已完成'}</p>
            <p><strong>用户状态:</strong> {user ? `✅ 已登录 (${user.nickname})` : '❌ 未登录'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">数据库测试</h2>
          <button
            onClick={testDatabaseConnection}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isTesting ? '测试中...' : '测试数据库连接'}
          </button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">环境信息</h2>
          <div className="space-y-2 text-sm">
            <p><strong>环境ID:</strong> {process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || 'suiyue-memoir-dev-3e9aoud20837ef'}</p>
            <p><strong>Node环境:</strong> {process.env.NODE_ENV}</p>
            <p><strong>构建时间:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 