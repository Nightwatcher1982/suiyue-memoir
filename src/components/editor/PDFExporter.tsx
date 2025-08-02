'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { MemoirProject, Chapter } from '@/types';

interface PDFExporterProps {
  project: MemoirProject;
  chapters: Chapter[];
  className?: string;
}

export function PDFExporter({ project, chapters, className }: PDFExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportToPDF = async () => {
    if (chapters.length === 0) {
      alert('没有章节内容可以导出');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // 创建PDF文档
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      
      // 使用默认字体
      try {
        pdf.setFont('helvetica');
      } catch (error) {
        console.warn('设置字体失败，使用默认字体:', error);
      }
      
      // 封面页
      pdf.setFontSize(24);
      // 对中文使用splitTextToSize处理，确保正确显示
      const titleLines = pdf.splitTextToSize(project.title, contentWidth);
      let titleY = 60;
      titleLines.forEach((line: string) => {
        pdf.text(line, pageWidth / 2, titleY, { align: 'center' });
        titleY += 10;
      });
      
      if (project.description) {
        pdf.setFontSize(14);
        const descLines = pdf.splitTextToSize(project.description, contentWidth);
        let descY = titleY + 20;
        descLines.forEach((line: string) => {
          pdf.text(line, pageWidth / 2, descY, { align: 'center' });
          descY += 8;
        });
      }
      
      pdf.setFontSize(12);
      pdf.text(`创建日期: ${formatDate(project.createdAt)}`, pageWidth / 2, pageHeight - 40, { align: 'center' });
      pdf.text(`总章节数: ${chapters.length}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

      // 目录页
      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text('目录', pageWidth / 2, 40, { align: 'center' });
      
      let yPosition = 60;
      pdf.setFontSize(12);
      
      chapters.forEach((chapter, index) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 40;
        }
        
        const chapterTitle = `第${index + 1}章 ${chapter.title}`;
        const titleLines = pdf.splitTextToSize(chapterTitle, contentWidth - 30);
        pdf.text(titleLines[0], margin, yPosition);
        pdf.text(`${index + 3}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 10;
      });

      // 章节内容
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        setExportProgress(((i + 1) / chapters.length) * 80);

        pdf.addPage();
        
        // 章节标题
        pdf.setFontSize(16);
        const chapterTitleText = `第${i + 1}章 ${chapter.title}`;
        const chapterTitleLines = pdf.splitTextToSize(chapterTitleText, contentWidth);
        let currentTitleY = 40;
        chapterTitleLines.forEach((line: string) => {
          pdf.text(line, margin, currentTitleY);
          currentTitleY += 8;
        });
        
        // 处理章节内容
        const content = chapter.content.replace(/<[^>]*>/g, ''); // 移除HTML标签
        const lines = pdf.splitTextToSize(content, contentWidth);
        
        let currentY = currentTitleY + 20;
        pdf.setFontSize(11);
        
        for (const line of lines) {
          if (currentY > pageHeight - 30) {
            pdf.addPage();
            currentY = 40;
          }
          
          pdf.text(line, margin, currentY);
          currentY += 6;
        }
        
        // 添加章节信息
        if (currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = 40;
        }
        
        currentY += 10;
        pdf.setFontSize(9);
        pdf.setTextColor(128);
        pdf.text(`字数: ${content.length} | 最后编辑: ${formatDate(chapter.updatedAt)}`, margin, currentY);
        pdf.setTextColor(0);
      }

      // 添加页码
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfDocument = pdf as any;
      const totalPages = pdfDocument.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(128);
        if (i > 1) { // 跳过封面页
          pdf.text(`${i - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
        pdf.setTextColor(0);
      }

      setExportProgress(90);

      // 生成文件名
      const fileName = `${project.title}_${formatDate(new Date()).replace(/\//g, '-')}.pdf`;
      
      setExportProgress(100);
      
      // 下载PDF
      pdf.save(fileName);
      
      alert('PDF导出成功！');
      
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert('PDF导出失败，请重试');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportChapterToPDF = async (chapter: Chapter, chapterIndex: number) => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      
      // 使用默认字体
      try {
        pdf.setFont('helvetica');
      } catch (error) {
        console.warn('设置字体失败，使用默认字体:', error);
      }
      
      // 章节标题
      pdf.setFontSize(18);
      pdf.text(`第${chapterIndex + 1}章 ${chapter.title}`, margin, 40);
      
      // 章节内容
      const content = chapter.content.replace(/<[^>]*>/g, '');
      const lines = pdf.splitTextToSize(content, contentWidth);
      
      let currentY = 60;
      pdf.setFontSize(12);
      
      for (const line of lines) {
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = 40;
        }
        
        pdf.text(line, margin, currentY);
        currentY += 7;
      }
      
      // 章节信息
      pdf.setFontSize(10);
      pdf.setTextColor(128);
      pdf.text(`字数: ${content.length} | 最后编辑: ${formatDate(chapter.updatedAt)}`, margin, pageHeight - 20);
      
      const fileName = `${project.title}_第${chapterIndex + 1}章_${chapter.title}.pdf`;
      pdf.save(fileName);
      
      alert('章节PDF导出成功！');
      
    } catch (error) {
      console.error('章节PDF导出失败:', error);
      alert('章节PDF导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const getContentPreview = () => {
    const totalWords = chapters.reduce((total, chapter) => {
      return total + chapter.content.replace(/<[^>]*>/g, '').length;
    }, 0);
    
    return {
      totalChapters: chapters.length,
      totalWords,
      estimatedPages: Math.ceil(totalWords / 500), // 假设每页500字
    };
  };

  const preview = getContentPreview();

  return (
    <div className={className}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">PDF导出</h3>
            <p className="text-sm text-gray-600 mt-1">将回忆录导出为PDF文档</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>总章节: {preview.totalChapters}</div>
            <div>总字数: {preview.totalWords}</div>
            <div>预估页数: {preview.estimatedPages}</div>
          </div>
        </div>

        {/* 导出选项 */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">完整回忆录导出</h4>
            <p className="text-sm text-gray-600 mb-4">
              包含封面、目录和所有章节内容的完整PDF文档
            </p>
            
            {isExporting && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>导出进度</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <Button
              onClick={exportToPDF}
              disabled={isExporting || chapters.length === 0}
              className="w-full"
            >
              {isExporting ? '导出中...' : '📄 导出完整PDF'}
            </Button>
          </div>

          {/* 单章节导出 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">单章节导出</h4>
            <p className="text-sm text-gray-600 mb-4">
              选择特定章节导出为PDF文档
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      第{index + 1}章 {chapter.title}
                    </h5>
                    <p className="text-sm text-gray-500">
                      {chapter.content.replace(/<[^>]*>/g, '').length} 字
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportChapterToPDF(chapter, index)}
                    disabled={isExporting}
                    className="ml-3"
                  >
                    📄 导出
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 导出说明 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">导出说明</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• PDF将包含所有文本内容，但图片可能需要网络连接才能正常显示</li>
            <li>• 导出的PDF会自动添加页码、目录和章节信息</li>
            <li>• 建议在导出前保存所有章节内容</li>
            <li>• 大文档导出可能需要几分钟时间，请耐心等待</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 