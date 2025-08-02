'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

export default function FixWordCountPage() {
  const { user } = useAuth();
  const [fixLog, setFixLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setFixLog(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const fixWordCount = async () => {
    if (!user) {
      addLog('用户未登录', 'error');
      return;
    }

    setLoading(true);
    setCompleted(false);
    setFixLog([]);
    addLog('开始修复所有项目的字数统计...', 'info');

    try {
      const { databaseService } = await import('@/lib/cloudbase/database');
      
      // 获取用户所有项目
      addLog('获取用户项目列表...', 'info');
      const projects = await databaseService.getUserProjects(user.id);
      addLog(`找到 ${projects.length} 个项目`, 'info');

      let totalFixed = 0;
      let totalProjects = projects.length;

      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        addLog(`[${i + 1}/${totalProjects}] 处理项目: ${project.title}`, 'info');
        
        try {
          // 获取项目章节
          const chapters = await databaseService.getProjectChapters(project.id);
          addLog(`  找到 ${chapters.length} 个章节`, 'info');
          
          // 计算总字数
          let totalWords = 0;
          let validChapters = 0;
          
          for (const chapter of chapters) {
            if (chapter && chapter.content && typeof chapter.content === 'string') {
              const textContent = chapter.content.replace(/<[^>]*>/g, '');
              const wordCount = textContent.length;
              totalWords += wordCount;
              validChapters++;
              
              if (wordCount > 0) {
                addLog(`    章节"${chapter.title}": ${wordCount} 字`, 'info');
              }
            }
          }
          
          addLog(`  计算结果: ${validChapters} 个有效章节, 总计 ${totalWords} 字`, 'info');
          
          // 更新项目统计
          await databaseService.updateProject(project.id, {
            chapterCount: chapters.length,
            wordCount: totalWords,
            updatedAt: new Date()
          });
          
          addLog(`  ✅ 项目统计已更新`, 'success');
          totalFixed++;
          
        } catch (error) {
          addLog(`  ❌ 处理项目失败: ${error}`, 'error');
        }
        
        // 短暂延迟避免数据库压力
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      addLog(`修复完成! 成功处理 ${totalFixed}/${totalProjects} 个项目`, 'success');
      
      // 验证修复结果
      addLog('验证修复结果...', 'info');
      const updatedProjects = await databaseService.getUserProjects(user.id);
      const totalWordsAfter = updatedProjects.reduce((sum, p) => sum + (p.wordCount || 0), 0);
      addLog(`修复后总字数: ${totalWordsAfter}`, 'success');
      
      setCompleted(true);
      
    } catch (error) {
      addLog(`修复过程发生错误: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    // 刷新到仪表盘
    window.location.href = '/dashboard';
  };

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <p>需要登录后才能修复字数统计</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">修复项目字数统计</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">说明</h2>
          <p className="text-blue-800 text-sm">
            此工具将重新计算所有项目的字数统计，并更新数据库中的记录。
            如果您的项目列表中显示字数为0，运行此修复工具可以解决问题。
          </p>
        </div>
        
        <div className="mb-6">
          <Button 
            onClick={fixWordCount} 
            disabled={loading}
            className="mr-4"
          >
            {loading ? '修复中...' : '开始修复'}
          </Button>
          
          {completed && (
            <Button 
              onClick={refreshDashboard}
              variant="outline"
            >
              返回项目列表
            </Button>
          )}
          
          <Button 
            onClick={() => setFixLog([])} 
            variant="outline"
            className="ml-4"
          >
            清空日志
          </Button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">修复日志</h2>
          <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
            {fixLog.length === 0 ? (
              <p className="text-gray-500">点击"开始修复"查看进度</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {fixLog.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.includes('ERROR') ? 'text-red-600' :
                      log.includes('SUCCESS') ? 'text-green-600' :
                      log.includes('WARNING') ? 'text-yellow-600' :
                      'text-gray-800'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {completed && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ 修复完成</h3>
            <p className="text-green-800 text-sm">
              字数统计已修复完成。您现在可以返回项目列表查看更新后的字数。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}