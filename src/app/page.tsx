'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoginModal } from '@/components/auth/LoginModal';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';

function HomePage() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, logout } = useAuth();

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // 登录成功后导航到工作台
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 
                className="text-2xl font-bold text-gray-900 font-noto-sans-sc cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => router.push('/')}
              >
                岁阅
              </h1>
              <span className="ml-2 text-sm text-gray-500">AI回忆录写作平台</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700">你好，{user.nickname}</span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    退出登录
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                  >
                    登录
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                  >
                    免费注册
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 英雄区块 */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            让每一段<span className="text-blue-600">人生故事</span>
            <br />
            都值得被<span className="text-blue-600">记录传承</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            通过AI技术，帮助您轻松将珍贵的回忆转化为精美的回忆录。
            从语音采集到文字润色，从章节整理到实体印刷，让写作变得简单而有意义。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="px-8"
              onClick={() => user ? router.push('/dashboard') : setShowLoginModal(true)}
            >
              {user ? '进入工作台' : '开始我的回忆录'}
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              了解更多功能
            </Button>
          </div>
        </div>

        {/* 功能特色 */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">语音转文字</h3>
            <p className="text-gray-600">
              口述您的故事，AI自动转换为文字。支持方言识别，让每一个细节都不遗漏。
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI智能润色</h3>
            <p className="text-gray-600">
              将口语化表达优化为优美的书面语，让您的回忆录更具文学色彩。
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">精美成书</h3>
            <p className="text-gray-600">
              一键导出电子书或订制实体印刷，让珍贵的回忆成为永恒的家族财富。
            </p>
          </div>
        </div>

        {/* 使用流程 */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            四步完成您的回忆录
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: '创建项目', desc: '为您的回忆录命名，选择封面模板' },
              { step: '02', title: '收集素材', desc: '上传照片，录制语音，邀请家人参与' },
              { step: '03', title: 'AI辅助写作', desc: '智能润色，章节整理，场景扩写' },
              { step: '04', title: '出版分享', desc: '导出电子书，订制实体印刷' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 岁阅. 让每一段人生故事都值得被记录传承.
          </p>
        </div>
      </footer>

      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}
