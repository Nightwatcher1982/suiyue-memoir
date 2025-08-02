'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { polishText, continueWriting, generateInterviewQuestions, expandContent } from '@/lib/ai/tongyi';

interface AIWritingAssistantProps {
  content: string;
  selectedText?: string;
  onContentUpdate: (newContent: string) => void;
  className?: string;
}

type AIAction = 'polish' | 'continue' | 'expand' | 'interview';

export function AIWritingAssistant({ 
  content, 
  selectedText, 
  onContentUpdate, 
  className 
}: AIWritingAssistantProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<Array<{
    type: string;
    description: string;
    original: string;
    improved: string;
  }>>([]);
  const [error, setError] = useState<string>('');
  const [expandDirection, setExpandDirection] = useState<'detail' | 'emotion' | 'background' | 'dialogue'>('detail');

  const handleAIAction = async (action: AIAction, direction?: 'detail' | 'emotion' | 'background' | 'dialogue') => {
    if (loading) return;

    const textToProcess = selectedText?.trim() || content.trim();
    
    // 验证输入
    if (!textToProcess) {
      setError('请先输入一些内容，然后再使用AI助手');
      return;
    }

    if (textToProcess.length < 10) {
      setError('内容太短，请至少输入10个字符');
      return;
    }

    setActiveAction(action);
    setLoading(true);
    setResult('');
    setSuggestions([]);
    setImprovements([]);
    setError('');

    try {
      let response;

      switch (action) {
        case 'polish':
          response = await polishText(textToProcess, {
            style: 'memoir',
            tone: 'warm',
            focus: 'style'
          });
          break;

        case 'continue':
          response = await continueWriting(textToProcess);
          break;

        case 'expand':
          response = await expandContent(textToProcess, direction || expandDirection);
          break;

        case 'interview':
          // 对于访谈问题，使用内容中的关键词作为话题
          const topic = textToProcess.slice(0, 50).replace(/[\n\r]/g, ' ');
          response = await generateInterviewQuestions(topic, textToProcess);
          break;

        default:
          throw new Error('未知的AI操作类型');
      }

      if (response.success && response.data) {
        if (response.data.polishedText) {
          setResult(response.data.polishedText);
        }
        if (response.data.suggestions) {
          setSuggestions(response.data.suggestions);
        }
        if (response.data.improvements) {
          setImprovements(response.data.improvements);
        }
      } else {
        setError(response.error || 'AI处理失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('AI操作失败:', error);
      setError(error.message || 'AI服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const applyResult = () => {
    if (!result) return;

    if (activeAction === 'continue') {
      // 续写：在原内容后添加
      const newContent = content + (content.endsWith('\n') ? '' : '\n\n') + result;
      onContentUpdate(newContent);
    } else if (activeAction === 'expand') {
      // 扩写：替换选中文本或在末尾添加
      if (selectedText) {
        const newContent = content.replace(selectedText, result);
        onContentUpdate(newContent);
      } else {
        onContentUpdate(result);
      }
    } else if (activeAction === 'polish') {
      // 润色：替换选中文本或全部内容
      if (selectedText) {
        const newContent = content.replace(selectedText, result);
        onContentUpdate(newContent);
      } else {
        onContentUpdate(result);
      }
    } else if (activeAction === 'interview') {
      // 访谈问题：不直接应用，用户可以复制问题
      return;
    }
    
    // 清空结果
    setResult('');
    setSuggestions([]);
    setImprovements([]);
    setError('');
    setActiveAction(null);
  };

  const dismissResult = () => {
    setResult('');
    setSuggestions([]);
    setImprovements([]);
    setError('');
    setActiveAction(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 简单的成功提示
      const originalText = text.slice(0, 20) + '...';
      alert(`已复制到剪贴板: ${originalText}`);
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  };

  if (!isVisible) {
    return (
      <div className={cn('fixed bottom-4 right-4 z-50', className)}>
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="sm"
        >
          🤖 AI助手
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 w-96 bg-white rounded-lg shadow-xl border', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900">🤖 AI写作助手</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border-b">
          <p className="text-red-700 text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError('')}
            className="mt-2"
          >
            了解
          </Button>
        </div>
      )}

      {/* 功能按钮 */}
      <div className="p-4 space-y-3">
        <div className="text-xs text-gray-500 mb-2">
          {selectedText ? `已选择文本: ${selectedText.slice(0, 30)}...` : '将处理全部内容'}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIAction('polish')}
            disabled={loading}
            className="text-left"
          >
            {loading && activeAction === 'polish' ? '润色中...' : '✨ 文本润色'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIAction('continue')}
            disabled={loading}
            className="text-left"
          >
            {loading && activeAction === 'continue' ? '续写中...' : '✍️ 智能续写'}
          </Button>
        </div>
        
        {/* 扩写选项 */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <select
              value={expandDirection}
              onChange={(e) => setExpandDirection(e.target.value as any)}
              className="text-xs border rounded px-2 py-1 flex-1"
              disabled={loading}
            >
              <option value="detail">增加细节</option>
              <option value="emotion">丰富情感</option>
              <option value="background">补充背景</option>
              <option value="dialogue">添加对话</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIAction('expand')}
              disabled={loading}
              className="flex-shrink-0"
            >
              {loading && activeAction === 'expand' ? '扩写中...' : '📝 扩写'}
            </Button>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAIAction('interview')}
          disabled={loading}
          className="w-full text-left"
        >
          {loading && activeAction === 'interview' ? '生成中...' : '❓ 生成访谈问题'}
        </Button>
      </div>

      {/* 结果显示 */}
      {(result || suggestions.length > 0) && (
        <div className="border-t bg-gray-50">
          <div className="p-4">
            {result && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">AI处理结果:</h4>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result)}
                      className="text-xs px-2 py-1"
                    >
                      复制
                    </Button>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border text-sm max-h-40 overflow-y-auto">
                  {result.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2">
                  {activeAction === 'interview' ? 'AI生成的访谈问题:' : 'AI处理说明:'}
                </h4>
                <div className="space-y-1">
                  {suggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-start text-xs text-gray-600 bg-white p-2 rounded">
                      {activeAction === 'interview' ? (
                        <div className="flex-1">
                          <span className="font-medium">{i + 1}. </span>
                          {suggestion}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(suggestion)}
                            className="ml-2 text-xs px-2 py-0"
                          >
                            复制
                          </Button>
                        </div>
                      ) : (
                        <span>• {suggestion}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-2">
              {result && activeAction !== 'interview' && (
                <Button
                  size="sm"
                  onClick={applyResult}
                  className="flex-1"
                >
                  应用到编辑器
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={dismissResult}
                className="flex-1"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}