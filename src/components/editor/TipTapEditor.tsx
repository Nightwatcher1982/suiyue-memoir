'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TipTapEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  onImageUpload?: (file: File) => void;
  placeholder?: string;
  className?: string;
}

export interface TipTapEditorRef {
  insertImage: (imageUrl: string) => void;
  insertText: (text: string) => void;
}

export const TipTapEditor = React.forwardRef<TipTapEditorRef, TipTapEditorProps>(({ 
  content, 
  onChange, 
  onSelectionChange,
  onImageUpload,
  placeholder = '开始记录您的回忆...',
  className 
}, ref) => {
  const [isClient, setIsClient] = useState(false);

  // 确保只在客户端渲染
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content,
    immediatelyRender: false, // 修复SSR hydration问题
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 bg-white text-gray-900',
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange?.(newContent);
      
      // 获取选中的文本
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      onSelectionChange?.(selectedText);
    },
  });

  // 当content prop变化时，更新编辑器内容
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // 保存当前光标位置
      const currentPos = editor.state.selection.anchor;
      
      // 更新内容
      editor.commands.setContent(content);
      
      // 尝试恢复光标位置（如果内容长度允许）
      try {
        if (currentPos <= editor.state.doc.content.size) {
          editor.commands.setTextSelection(currentPos);
        }
      } catch (e) {
        // 如果恢复光标位置失败，忽略错误
        console.debug('无法恢复光标位置:', e);
      }
      
      console.log('📝 TipTap编辑器内容已更新:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
    }
  }, [editor, content]);

  // 添加图片功能
  const addImage = () => {
    const url = window.prompt('请输入图片URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // 插入图片的功能（供外部调用）
  const insertImage = (imageUrl: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
  };

  // 插入文本的功能（供OCR等外部调用）
  const insertText = (text: string) => {
    if (editor) {
      // 聚焦到编辑器
      editor.commands.focus();
      
      // HTML转义函数
      const escapeHtml = (str: string) => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // 将文本按行分割，转换为HTML格式
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;
      
      // 将每行文本转换为段落HTML，并进行HTML转义
      const htmlContent = lines
        .map(line => `<p>${escapeHtml(line.trim())}</p>`)
        .join('');
      
      // 使用insertContent插入HTML内容
      editor.commands.insertContent(htmlContent);
      
      console.log('📝 TipTap插入文本完成:', lines.length, '行段落');
    }
  };
  
  // 向外暴露方法
  React.useImperativeHandle(ref, () => ({
    insertImage,
    insertText,
  }));

  // 添加链接功能
  const addLink = () => {
    const url = window.prompt('请输入链接URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // 如果不是客户端或编辑器未加载，显示加载状态
  if (!isClient || !editor) {
    return (
      <div className={cn('border border-gray-200 rounded-lg', className)}>
        <div className="border-b border-gray-200 p-2">
          <div className="flex flex-wrap gap-1">
            {/* 模拟工具栏 */}
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="min-h-[400px] p-4 flex items-center justify-center">
          <div className="text-gray-500">编辑器加载中...</div>
        </div>
      </div>
    );
  }

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div className={cn('border border-gray-200 rounded-lg', className)}>
      {/* 工具栏 */}
      <div className="border-b border-gray-200 p-2">
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            <strong>B</strong>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            <em>I</em>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            <s>S</s>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            H2
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            H3
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            • 列表
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            1. 列表
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
          >
            &ldquo;&rdquo; 引用
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            ― 分割线
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={addImage}
          >
            🖼️ 图片
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={addLink}
          >
            🔗 链接
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            ↶ 撤销
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            ↷ 重做
          </Button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* 状态栏 */}
      <div className="border-t border-gray-200 px-4 py-2 text-sm text-gray-600 flex justify-between">
        <span>字数: {wordCount} | 字符: {charCount}</span>
        <span className="text-gray-400">Ctrl+Z 撤销 • Ctrl+Y 重做</span>
      </div>
    </div>
  );
});

TipTapEditor.displayName = 'TipTapEditor';