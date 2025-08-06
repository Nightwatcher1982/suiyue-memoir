import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

// Qwen-VL-OCR手写体识别服务健康检查
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Qwen-VL-OCR手写体识别健康检查');
    
    const hasDashscopeKey = !!(process.env.DASHSCOPE_API_KEY || API_CONFIG.TONGYI.API_KEY);
    
    return NextResponse.json({
      service: 'qwen-vl-ocr-handwriting',
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        hasDashscopeKey,
        endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        model: 'qwen-vl-ocr'
      },
      ready: hasDashscopeKey,
      features: [
        '支持中文手写体识别',
        '支持英文手写体识别', 
        '支持数字手写体识别',
        '支持多语言识别',
        '基于通义千问VL-OCR模型',
        '高准确率识别'
      ]
    });
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    return NextResponse.json(
      {
        service: 'qwen-vl-ocr-handwriting',
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}