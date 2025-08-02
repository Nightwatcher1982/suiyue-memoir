'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
  className?: string;
}

interface OCRResult {
  success: boolean;
  text: string;
  message: string;
  confidence?: number;
  originalFileName?: string;
  fileSize?: number;
  error?: string;
}

export function OCRUpload({ onTextExtracted, className }: OCRUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件不能超过5MB');
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 开始OCR识别
    await performOCR(file);
  };

  const performOCR = async (file: File) => {
    setIsProcessing(true);
    setExtractedText('');
    setOcrResult(null);

    try {
      console.log('📸 开始OCR识别:', file.name);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const result: OCRResult = await response.json();
      setOcrResult(result);

      if (result.success && result.text) {
        setExtractedText(result.text);
        console.log('✅ OCR识别成功:', result.text.length, '个字符');
      } else {
        console.warn('⚠️ OCR识别失败:', result.error || result.message);
      }
    } catch (error) {
      console.error('❌ OCR请求失败:', error);
      setOcrResult({
        success: false,
        text: '',
        message: '网络请求失败',
        error: error instanceof Error ? error.message : '未知错误'
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
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
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
          <div className="text-4xl">📸</div>
          <div className="text-lg font-medium text-gray-900">
            {isProcessing ? '正在识别文字...' : '上传图片识别文字'}
          </div>
          <div className="text-sm text-gray-600">
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>AI正在分析图片中的文字...</span>
              </div>
            ) : (
              <>
                <p>点击上传或拖拽图片到这里</p>
                <p className="text-xs text-gray-500 mt-1">
                  支持 JPG、PNG、GIF 格式，最大 5MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 图片预览 */}
      {previewImage && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">📷 图片预览</h4>
          <div className="flex justify-center">
            <img
              src={previewImage}
              alt="上传的图片"
              className="max-w-full max-h-64 object-contain rounded-lg shadow-sm"
            />
          </div>
        </div>
      )}

      {/* OCR结果 */}
      {ocrResult && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              {ocrResult.success ? '🔍 识别结果' : '❌ 识别失败'}
            </h4>
            {ocrResult.success && extractedText && (
              <div className="text-sm text-gray-500">
                识别出 {extractedText.length} 个字符
              </div>
            )}
          </div>

          {ocrResult.success ? (
            <>
              {extractedText ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                      {extractedText}
                    </pre>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleInsertText}
                      className="flex-1"
                      size="sm"
                    >
                      ✅ 插入到编辑器
                    </Button>
                    <Button
                      onClick={handleClearAll}
                      variant="outline"
                      size="sm"
                    >
                      🗑️ 清空
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">🤔</div>
                  <p>未识别到文字内容</p>
                  <p className="text-xs mt-1">
                    请尝试上传文字更清晰的图片
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
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 使用提示</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 确保图片中的文字清晰可见</li>
          <li>• 支持中文、英文等多种语言识别</li>
          <li>• 识别后的文字可以直接插入到编辑器中</li>
          <li>• 建议上传高分辨率、对比度高的图片</li>
        </ul>
      </div>
    </div>
  );
}