'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
  actionText?: string;
  actionHref?: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: '创建档案',
    description: '建立您的回忆录项目框架',
    icon: '📁',
    details: [
      '创建新项目或导入现有文档',
      '设置项目名称和描述',
      '选择回忆录风格和主题',
    ],
    actionText: '新建项目',
  },
  {
    id: 2,
    title: '整理档案',
    description: '收集和整理相关素材',
    icon: '📸',
    details: [
      '上传珍贵的照片和图片',
      '维护人物关系图谱',
      '整理时间线和重要事件',
    ],
    actionText: '照片管理',
    actionHref: '/photo-materials',
  },
  {
    id: 3,
    title: '编写回忆录',
    description: '用心记录人生故事',
    icon: '✍️',
    details: [
      '使用AI写作助手润色文字',
      '语音录制转换为文字',
      '分章节组织内容结构',
    ],
    actionText: '开始写作',
  },
  {
    id: 4,
    title: '出版发布',
    description: '分享您的珍贵回忆',
    icon: '📖',
    details: [
      '导出为PDF电子书',
      '生成精美的排版',
      '与家人朋友分享',
    ],
    actionText: '预览效果',
  },
];

interface WorkflowGuideProps {
  onCreateProject?: () => void;
  className?: string;
  autoExpand?: boolean;
}

export function WorkflowGuide({ onCreateProject, className = '', autoExpand = false }: WorkflowGuideProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(autoExpand);

  const handleStepClick = (stepId: number) => {
    setSelectedStep(selectedStep === stepId ? null : stepId);
  };

  const handleActionClick = (step: WorkflowStep) => {
    if (step.actionHref) {
      window.location.href = step.actionHref;
    } else if (step.id === 1 && onCreateProject) {
      onCreateProject();
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 ${className}`}>
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗺️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">创建回忆录指南</h3>
              <p className="text-sm text-gray-600">跟随步骤，轻松创建您的人生回忆录</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '收起' : '展开'} {isExpanded ? '▲' : '▼'}
          </Button>
        </div>
      </div>

      {/* 工作流程内容 */}
      {isExpanded && (
        <div className="p-6">
          {/* 步骤概览 */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {WORKFLOW_STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  {/* 步骤图标和标题 */}
                  <div 
                    className={`flex-1 text-center cursor-pointer transition-all duration-200 p-4 rounded-lg ${
                      selectedStep === step.id 
                        ? 'bg-blue-100 border-2 border-blue-300' 
                        : 'hover:bg-white hover:shadow-sm border-2 border-transparent'
                    }`}
                    onClick={() => handleStepClick(step.id)}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        selectedStep === step.id ? 'bg-blue-200' : 'bg-white shadow-sm'
                      }`}>
                        {step.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* 连接线 */}
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className="hidden md:flex items-center justify-center mx-2">
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full ml-1"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 步骤详情 */}
          {selectedStep && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              {(() => {
                const step = WORKFLOW_STEPS.find(s => s.id === selectedStep);
                if (!step) return null;

                return (
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-3xl">{step.icon}</span>
                      <div>
                        <h5 className="text-xl font-semibold text-gray-900">{step.title}</h5>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h6 className="font-medium text-gray-900 mb-3">具体步骤：</h6>
                        <ul className="space-y-2">
                          {step.details.map((detail, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span className="text-sm text-gray-700">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-col justify-center">
                        {step.actionText && (
                          <Button
                            onClick={() => handleActionClick(step)}
                            className="w-full md:w-auto"
                          >
                            {step.actionText}
                          </Button>
                        )}
                        
                        {step.id === 1 && (
                          <div className="mt-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h6 className="font-medium text-blue-900 mb-2">💡 新手提示</h6>
                              <p className="text-sm text-blue-700">
                                建议先创建一个测试项目熟悉功能，然后再开始正式的回忆录写作。
                              </p>
                            </div>
                          </div>
                        )}

                        {step.id === 2 && (
                          <div className="mt-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h6 className="font-medium text-green-900 mb-2">📝 整理建议</h6>
                              <p className="text-sm text-green-700">
                                按时间顺序整理照片，记录每张照片的背景故事，这会让写作更加生动。
                              </p>
                            </div>
                          </div>
                        )}

                        {step.id === 3 && (
                          <div className="mt-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h6 className="font-medium text-purple-900 mb-2">🎯 写作技巧</h6>
                              <p className="text-sm text-purple-700">
                                可以使用语音录制功能，就像和朋友聊天一样自然地讲述您的故事。
                              </p>
                            </div>
                          </div>
                        )}

                        {step.id === 4 && (
                          <div className="mt-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <h6 className="font-medium text-orange-900 mb-2">🎊 分享价值</h6>
                              <p className="text-sm text-orange-700">
                                您的回忆录不仅是个人记录，更是留给后代的珍贵财富。
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 快速开始按钮 */}
          {!selectedStep && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-4">准备开始您的回忆录之旅吗？</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={onCreateProject} size="lg">
                  🚀 立即创建项目
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedStep(1)}
                  size="lg"
                >
                  📖 查看详细指南
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 收起状态的简要信息 */}
      {!isExpanded && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-2">
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{step.title}</span>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <span className="text-gray-400 mx-2">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}