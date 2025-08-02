'use client';

import React, { useState, useRef } from 'react';
import { TipTapEditor, type TipTapEditorRef } from './TipTapEditor';
import { PhotoUploadEnhanced } from './PhotoUploadEnhanced';
import { PhotoPickerModal } from '@/components/photos/PhotoPickerModal';
import { OCRUpload } from './OCRUpload';
import { AIWritingAssistant } from '@/components/ai/AIWritingAssistant';
import { VoiceRecorder } from '@/components/ai/VoiceRecorder';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Photo } from '@/types';

interface EditorWithUploadProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  projectId?: string;
  chapterId?: string;
}

export function EditorWithUpload({ 
  content = '', 
  onChange, 
  placeholder,
  className,
  projectId,
  chapterId
}: EditorWithUploadProps) {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showOCRUpload, setShowOCRUpload] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef<TipTapEditorRef>(null);

  const handlePhotoUpload = (imageUrl: string, file: File) => {
    // 使用编辑器的插入图片方法
    setShowPhotoUpload(false);
    
    console.log('📸 插入图片到编辑器:', imageUrl, file.name);
    
    // 通过ref调用编辑器的insertImage方法
    if (editorRef.current) {
      editorRef.current.insertImage(imageUrl);
    } else {
      // 兜底方案：直接更新content
      const imageHtml = `<img src="${imageUrl}" alt="${file.name}" class="max-w-full h-auto rounded-lg shadow-md my-4" />`;
      const newContent = content ? `${content}<br/>${imageHtml}` : imageHtml;
      onChange?.(newContent);
    }
  };

  const handlePhotoSelected = (photo: Photo) => {
    // 从照片档案选择照片
    setShowPhotoPicker(false);
    
    console.log('🖼️ 从照片档案插入图片到编辑器:', photo.name);
    
    // 通过ref调用编辑器的insertImage方法
    if (editorRef.current) {
      editorRef.current.insertImage(photo.url);
    } else {
      // 兜底方案：直接更新content
      const imageHtml = `<img src="${photo.url}" alt="${photo.name}" class="max-w-full h-auto rounded-lg shadow-md my-4" />`;
      const newContent = content ? `${content}<br/>${imageHtml}` : imageHtml;
      onChange?.(newContent);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    // 将语音转换的文字添加到编辑器
    setShowVoiceRecorder(false);
    
    console.log('🎤 开始插入语音文字到编辑器:', text.length, '个字符');
    
    // 通过ref调用编辑器的insertText方法
    if (editorRef.current) {
      editorRef.current.insertText(text);
      console.log('✅ 语音文字已通过ref插入到编辑器');
    } else {
      // 兜底方案：直接更新content
      const newContent = content ? `${content}\n\n${text}` : text;
      onChange?.(newContent);
    }
  };

  const handleOCRTextExtracted = (text: string) => {
    // 将OCR识别的文字添加到编辑器
    setShowOCRUpload(false);
    
    console.log('📝 开始插入OCR文字到编辑器:', text.length, '个字符');
    
    // 通过ref调用编辑器的insertText方法
    if (editorRef.current) {
      editorRef.current.insertText(text);
      console.log('✅ OCR文字已通过ref插入到编辑器');
    } else {
      // 兜底方案：直接更新content
      console.log('⚠️ 编辑器ref不可用，使用兜底方案');
      const htmlText = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
      
      const newContent = content ? `${content}${htmlText}` : htmlText;
      onChange?.(newContent);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 工具栏 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700 font-medium">
          富文本编辑器
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
          >
            📷 {showPhotoUpload ? '关闭照片上传' : '上传照片'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPhotoPicker(!showPhotoPicker)}
          >
            🖼️ {showPhotoPicker ? '关闭照片选择' : '选择照片'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
          >
            🎤 {showVoiceRecorder ? '关闭语音录制' : '语音输入'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowOCRUpload(!showOCRUpload)}
          >
            📸 {showOCRUpload ? '关闭文字识别' : '图片识字'}
          </Button>
          <AIWritingAssistant
            content={content}
            selectedText={selectedText}
            onContentUpdate={onChange || (() => {})}
          />
        </div>
      </div>

      {/* 照片上传组件 */}
      {showPhotoUpload && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <PhotoUploadEnhanced 
            onPhotoUpload={handlePhotoUpload}
            projectId={projectId}
            chapterId={chapterId}
          />
        </div>
      )}

      {/* 照片选择器模态框 */}
      <PhotoPickerModal
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onPhotoSelected={handlePhotoSelected}
        projectId={projectId}
        chapterId={chapterId}
      />

      {/* 语音录制组件 */}
      {showVoiceRecorder && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <VoiceRecorder onTranscription={handleVoiceTranscription} />
        </div>
      )}

      {/* OCR文字识别组件 */}
      {showOCRUpload && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <OCRUpload onTextExtracted={handleOCRTextExtracted} />
        </div>
      )}

      {/* 富文本编辑器 */}
      <TipTapEditor
        ref={editorRef}
        content={content}
        onChange={onChange}
        onSelectionChange={setSelectedText}
        placeholder={placeholder}
        className="bg-white shadow-sm"
      />
    </div>
  );
} 