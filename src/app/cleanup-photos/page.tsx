'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { cleanupBlobUrls, cleanupAllBlobUrls } from '@/lib/utils/cleanupBlobUrls';

export default function CleanupPhotosPage() {
  const { user } = useAuth();
  const [isCleaningUser, setIsCleaningUser] = useState(false);
  const [isCleaningAll, setIsCleaningAll] = useState(false);
  const [userResult, setUserResult] = useState<{ cleaned: number; errors: string[] } | null>(null);
  const [allResult, setAllResult] = useState<{ totalCleaned: number; errors: string[] } | null>(null);

  const handleCleanupUser = async () => {
    if (!user) return;
    
    setIsCleaningUser(true);
    setUserResult(null);
    
    try {
      const result = await cleanupBlobUrls(user.id);
      setUserResult(result);
    } catch (error) {
      setUserResult({
        cleaned: 0,
        errors: [`清理失败: ${error}`]
      });
    } finally {
      setIsCleaningUser(false);
    }
  };

  const handleCleanupAll = async () => {
    setIsCleaningAll(true);
    setAllResult(null);
    
    try {
      const result = await cleanupAllBlobUrls();
      setAllResult(result);
    } catch (error) {
      setAllResult({
        totalCleaned: 0,
        errors: [`全局清理失败: ${error}`]
      });
    } finally {
      setIsCleaningAll(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600">您需要登录后才能执行数据清理</p>
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
              <h1 className="text-2xl font-bold text-gray-900">数据清理工具</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
            >
              返回工作台
            </Button>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧹 清理无效的照片数据</h2>
          <p className="text-gray-600 mb-6">
            如果您在照片档案中看到"blob URL"错误，说明数据库中存在无效的临时URL。
            使用此工具可以清理这些无效数据。
          </p>

          <div className="space-y-6">
            {/* 清理当前用户数据 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">清理我的照片数据</h3>
              <p className="text-sm text-gray-600 mb-4">
                只清理当前登录用户 ({user.nickname}) 的无效照片记录
              </p>
              
              <Button
                onClick={handleCleanupUser}
                disabled={isCleaningUser}
                className="mb-4"
              >
                {isCleaningUser ? '清理中...' : '🧹 清理我的数据'}
              </Button>

              {userResult && (
                <div className={`p-4 rounded-md ${
                  userResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
                }`}>
                  <h4 className="font-medium mb-2">清理结果：</h4>
                  <p className="text-sm">
                    ✅ 删除了 {userResult.cleaned} 张无效照片记录
                  </p>
                  {userResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-yellow-800">错误信息：</p>
                      <ul className="text-sm text-yellow-700 mt-1">
                        {userResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 全局清理 */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="text-lg font-medium mb-2 text-red-800">⚠️ 全局数据清理</h3>
              <p className="text-sm text-red-700 mb-4">
                清理所有用户的无效照片记录。<strong>请谨慎使用！</strong>
              </p>
              
              <Button
                onClick={handleCleanupAll}
                disabled={isCleaningAll}
                variant="outline"
                className="mb-4 border-red-300 text-red-700 hover:bg-red-100"
              >
                {isCleaningAll ? '全局清理中...' : '🗑️ 全局清理'}
              </Button>

              {allResult && (
                <div className={`p-4 rounded-md ${
                  allResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
                }`}>
                  <h4 className="font-medium mb-2">全局清理结果：</h4>
                  <p className="text-sm">
                    ✅ 删除了 {allResult.totalCleaned} 张无效照片记录
                  </p>
                  {allResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-yellow-800">错误信息：</p>
                      <ul className="text-sm text-yellow-700 mt-1">
                        {allResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">📋 使用说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 清理完成后，请刷新照片档案页面</li>
            <li>• 被删除的是无效的照片记录，不会影响真实的照片文件</li>
            <li>• 如果照片是通过新的上传系统上传的，不会被误删</li>
            <li>• 建议先尝试"清理我的数据"选项</li>
          </ul>
        </div>
      </main>
    </div>
  );
}