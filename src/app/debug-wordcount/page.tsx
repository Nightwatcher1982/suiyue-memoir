'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

export default function DebugWordCountPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugInfo(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const debugWordCount = async () => {
    if (!user) {
      addLog('用户未登录');
      return;
    }

    setLoading(true);
    setDebugInfo([]);
    addLog('开始调试字数统计问题...');

    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      
      // 1. 获取用户项目
      addLog('1. 获取用户项目...');
      const projects = await databaseService.getUserProjects(user.id);
      addLog(`用户项目数量: ${projects.length}`);
      
      for (const project of projects) {
        addLog(`项目: ${project.title}`);
        addLog(`  - ID: ${project.id}`);
        addLog(`  - 当前wordCount: ${project.wordCount}`);
        addLog(`  - 当前chapterCount: ${project.chapterCount}`);
        
        // 2. 获取项目章节
        addLog(`2. 获取项目 ${project.title} 的章节...`);
        const chapters = await databaseService.getProjectChapters(project.id);
        addLog(`章节数量: ${chapters.length}`);
        
        let totalWords = 0;
        for (const chapter of chapters) {
          if (chapter && chapter.content) {
            const textContent = chapter.content.replace(/<[^>]*>/g, '');
            const wordCount = textContent.length;
            totalWords += wordCount;
            addLog(`  章节: ${chapter.title}`);
            addLog(`    - ID: ${chapter.id}`);
            addLog(`    - 内容长度: ${chapter.content.length} 字符`);
            addLog(`    - 纯文本长度: ${wordCount} 字`);
            addLog(`    - 内容预览: "${textContent.substring(0, 50)}${textContent.length > 50 ? '...' : ''}"`);
          } else {
            addLog(`  章节: ${chapter?.title || '未知'} - 无内容`);
          }
        }
        
        addLog(`计算出的总字数: ${totalWords}`);
        
        // 3. 测试更新项目统计
        addLog(`3. 更新项目统计...`);
        await databaseService.updateProjectStats(project.id);
        
        // 4. 重新获取项目查看更新结果
        const updatedProject = await databaseService.getProjectById(project.id);
        if (updatedProject) {
          addLog(`更新后的wordCount: ${updatedProject.wordCount}`);
          addLog(`更新后的chapterCount: ${updatedProject.chapterCount}`);
        }
        
        addLog('---');
      }
      
      // 5. 测试用户统计
      addLog('4. 获取用户统计...');
      const stats = await databaseService.getUserStats(user.id);
      addLog(`统计结果:`);
      addLog(`  - projectCount: ${stats.projectCount}`);
      addLog(`  - chapterCount: ${stats.chapterCount}`);
      addLog(`  - totalWords: ${stats.totalWords}`);
      
    } catch (error) {
      addLog(`错误: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <p>需要登录后才能进行字数调试</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">字数统计调试</h1>
        
        <div className="mb-6">
          <Button 
            onClick={debugWordCount} 
            disabled={loading}
            className="mr-4"
          >
            {loading ? '调试中...' : '开始调试'}
          </Button>
          <Button 
            onClick={() => setDebugInfo([])} 
            variant="outline"
          >
            清空日志
          </Button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">调试日志</h2>
          <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500">点击"开始调试"查看详细信息</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {debugInfo.map((log, index) => (
                  <div key={index} className="text-gray-800">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">调试说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 检查用户项目数据</li>
            <li>• 检查每个项目的章节内容</li>
            <li>• 计算实际字数</li>
            <li>• 更新项目统计</li>
            <li>• 验证更新结果</li>
          </ul>
        </div>
      </div>
    </div>
  );
}