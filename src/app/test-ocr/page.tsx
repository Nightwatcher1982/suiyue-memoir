'use client';

import React from 'react';
import { OCRUpload } from '@/components/editor/OCRUpload';

export default function TestOCRPage() {
  const handleTextExtracted = (text: string) => {
    console.log('提取的文字:', text);
    alert(`成功识别文字:\n\n${text}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📸 图片文字识别测试
          </h1>
          <p className="text-gray-600">
            上传包含文字的图片，AI将自动识别并提取其中的文字内容
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <OCRUpload onTextExtracted={handleTextExtracted} />
        </div>

        {/* 使用示例 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">✅ 适合的图片类型</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 📄 扫描的文档、合同、证件</li>
              <li>• 📖 书籍、报纸、杂志页面</li>
              <li>• 🖼️ 包含文字的海报、广告</li>
              <li>• 📝 手写笔记（字迹清晰）</li>
              <li>• 💻 屏幕截图中的文字</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">⚠️ 注意事项</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 🌟 确保图片清晰，文字对比度高</li>
              <li>• 📏 避免图片过度倾斜或扭曲</li>
              <li>• 💡 良好的光线条件拍摄效果更佳</li>
              <li>• 📱 支持中文、英文等多种语言</li>
              <li>• 🚀 识别速度取决于网络状况</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}