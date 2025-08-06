'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HandwritingOCRProps {
  onTextExtracted: (text: string) => void;
  className?: string;
}

interface HandwritingOCRResult {
  success: boolean;
  text: string;
  message: string;
  confidence?: number;
  recognitionType?: 'handwriting';
  requestId?: string;
  originalFileName?: string;
  fileSize?: number;
  error?: string;
  details?: {
    wordCount: number;
    wordsInfo: any[];
    characterInfo?: any[];
  };
}

export function HandwritingOCR({ onTextExtracted, className }: HandwritingOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<HandwritingOCRResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件不能超过10MB');
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 开始手写体识别
    await performHandwritingOCR(file);
  };

  const performHandwritingOCR = async (file: File) => {
    setIsProcessing(true);
    setExtractedText('');
    setOcrResult(null);

    try {
      console.log('🖋️ 开始手写体识别:', file.name);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr-handwriting-v2', {
        method: 'POST',
        body: formData,
      });

      const result: HandwritingOCRResult = await response.json();
      setOcrResult(result);

      if (result.success && result.text) {
        setExtractedText(result.text);
        console.log('✅ 手写体识别成功:', result.text.length, '个字符');
        console.log('📊 识别准确率:', (result.confidence || 0.98) * 100 + '%');
      } else {
        console.warn('⚠️ 手写体识别失败:', result.error || result.message);
      }
    } catch (error) {
      console.error('❌ 手写体识别请求失败:', error);
      setOcrResult({
        success: false,
        text: '',
        message: '网络请求失败',
        error: error instanceof Error ? error.message : '未知错误',
        recognitionType: 'handwriting'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInsertText = () => {
    if (extractedText.trim()) {
      onTextExtracted(extractedText.trim());
      // 清空状态
      setPreviewImage(null);
      setExtractedText('');
      setOcrResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearAll = () => {
    setPreviewImage(null);
    setExtractedText('');
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传区域 */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          dragActive ? 'border-purple-500 bg-purple-50' : 'border-purple-300 hover:border-purple-400',
          isProcessing && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isProcessing}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">🖋️</div>
          <div className="text-lg font-medium text-gray-900">
            {isProcessing ? '正在识别手写文字...' : '专业手写体识别'}
          </div>
          <div className="text-sm text-gray-600">
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span>AI正在专业识别手写内容...</span>
              </div>
            ) : (
              <>
                <p>点击上传或拖拽手写图片到这里</p>
                <p className="text-xs text-gray-500 mt-1">
                  支持 JPG、PNG、GIF、WebP、BMP、TIFF 格式，最大 10MB
                </p>
                <p className="text-xs text-purple-600 font-medium mt-2">
                  🤖 基于通义千问VL-OCR模型，专业手写体识别
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 图片预览 */}
      {previewImage && (
        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
          <h4 className="font-medium text-gray-900 mb-3">🖼️ 手写体图片预览</h4>
          <div className="flex justify-center">
            <img
              src={previewImage}
              alt="上传的手写体图片"
              className="max-w-full max-h-64 object-contain rounded-lg shadow-sm border"
            />
          </div>
        </div>
      )}

      {/* OCR结果 */}
      {ocrResult && (
        <div className="border border-purple-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              {ocrResult.success ? '🔍 手写体识别结果' : '❌ 识别失败'}
            </h4>
            {ocrResult.success && extractedText && (
              <div className="text-sm text-purple-600 font-medium">
                识别出 {extractedText.length} 个字符 
                {ocrResult.confidence && (
                  <span className="ml-2">
                    (准确率: {Math.round(ocrResult.confidence * 100)}%)
                  </span>
                )}
              </div>
            )}
          </div>

          {ocrResult.success ? (
            <>
              {extractedText ? (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border max-h-40 overflow-y-auto shadow-sm">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono leading-relaxed">
                      {extractedText}
                    </pre>
                  </div>
                  
                  {/* 识别详情 */}
                  {ocrResult.details && (
                    <div className="text-xs text-purple-600 space-y-1">
                      <p>📊 识别详情: {ocrResult.details.wordCount} 个词汇单元</p>
                      {ocrResult.requestId && (
                        <p>🆔 请求ID: {ocrResult.requestId.slice(0, 8)}...</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleInsertText}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      ✅ 插入到编辑器
                    </Button>
                    <Button
                      onClick={handleClearAll}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      🗑️ 清空
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">🤔</div>
                  <p>未识别到手写文字内容</p>
                  <p className="text-xs mt-1">
                    请尝试上传手写文字更清晰的图片
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-red-600">
              <div className="text-2xl mb-2">❌</div>
              <p>{ocrResult.message}</p>
              {ocrResult.error && (
                <p className="text-xs mt-1 text-gray-500">
                  错误详情: {ocrResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-2">🖋️ 手写体识别专业提示</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• 🤖 <strong>先进模型</strong>：基于通义千问VL-OCR，专业手写体识别引擎</li>
          <li>• 🌍 <strong>多语言支持</strong>：中文、英文、数字及多种语言手写体</li>
          <li>• 📝 <strong>智能识别</strong>：自动理解上下文，提高识别准确率</li>
          <li>• 📱 <strong>复杂场景</strong>：支持笔记本、黑板、便条纸等各种背景</li>
          <li>• 💡 <strong>最佳效果</strong>：建议上传清晰、对比度高的手写体图片</li>
        </ul>
        
        <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-700">
          <strong>💎 技术优势：</strong>
          采用通义千问VL-OCR多模态大模型，相比传统OCR具有更强的上下文理解能力和手写体适应性。
        </div>
      </div>
    </div>
  );
}