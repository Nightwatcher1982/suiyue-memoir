'use client';

import React, { useState } from 'react';
import { SimpleVoiceInput } from './SimpleVoiceInput';
import { ProfessionalVoiceInput } from './ProfessionalVoiceInput';
import { cn } from '@/lib/utils';

interface VoiceInputContainerProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
}

export function VoiceInputContainer({ onTranscriptionComplete, className }: VoiceInputContainerProps) {
  const [activeTab, setActiveTab] = useState<'simple' | 'professional'>('simple');

  return (
    <div className={cn('space-y-4', className)}>
      {/* 标题和说明 */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-800">语音转文字工具</h2>
        <p className="text-sm text-gray-600">
          选择适合您需求的语音识别方式，识别完成后可一键导入编辑器
        </p>
      </div>

      {/* 标签页切换 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('simple')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
            activeTab === 'simple'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>普通识别</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            免费 • 即时 • 浏览器本地
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('professional')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
            activeTab === 'professional'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>专业识别</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            高精度 • 长音频 • AI引擎
          </div>
        </button>
      </div>

      {/* 标签页内容 */}
      <div className="min-h-[400px]">
        {activeTab === 'simple' && (
          <SimpleVoiceInput 
            onTranscriptionComplete={onTranscriptionComplete}
          />
        )}
        
        {activeTab === 'professional' && (
          <ProfessionalVoiceInput 
            onTranscriptionComplete={onTranscriptionComplete}
          />
        )}
      </div>

      {/* 功能对比说明 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3">功能对比</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-blue-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              普通识别
            </div>
            <ul className="space-y-1 text-gray-600 pl-6">
              <li>• 完全免费使用</li>
              <li>• 实时语音识别</li>
              <li>• 隐私保护（本地处理）</li>
              <li>• 支持连续识别</li>
              <li>• 适合日常简单录入</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-purple-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              专业识别
            </div>
            <ul className="space-y-1 text-gray-600 pl-6">
              <li>• 高精度识别（95%+）</li>
              <li>• 支持长音频文件</li>
              <li>• 文件上传识别</li>
              <li>• 置信度评分</li>
              <li>• 适合专业内容创作</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">使用建议</p>
            <p className="text-blue-700">
              <strong>普通识别</strong>适合快速录入和简单笔记；
              <strong>专业识别</strong>适合重要文档、访谈记录等对准确性要求较高的场景。
              识别完成后点击"导入编辑器"即可将文字插入到当前编辑位置。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}