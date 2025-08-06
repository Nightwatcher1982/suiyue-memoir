'use client';

import React from 'react';
import { HandwritingOCR } from '@/components/editor/HandwritingOCR';

export default function TestHandwritingOCRPage() {
  const handleTextExtracted = (text: string) => {
    console.log('📄 手写体识别结果:', text);
    alert(`识别结果：\n${text}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🖋️ 手写体识别测试页面
            </h1>
            <p className="text-gray-600">
              测试基于通义千问VL-OCR的专业手写体识别功能
            </p>
          </div>
          
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">🧪 测试说明</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 上传包含手写文字的图片进行识别测试</li>
                <li>• 支持中文、英文、数字手写体识别</li>
                <li>• 识别结果将通过弹框显示</li>
                <li>• 支持格式：JPG、PNG、GIF、WebP、BMP、TIFF</li>
              </ul>
            </div>
          </div>

          <HandwritingOCR onTextExtracted={handleTextExtracted} />
          
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-500">
              基于通义千问VL-OCR多模态大模型 | 
              <a href="/editor/test" className="ml-2 text-blue-600 hover:text-blue-800">
                返回编辑器测试
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}