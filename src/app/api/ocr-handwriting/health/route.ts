import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

// 手写体识别服务健康检查
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 手写体识别健康检查');
    
    const hasAccessKeyId = !!API_CONFIG.ALIBABA.ACCESS_KEY_ID;
    const hasAccessKeySecret = !!API_CONFIG.ALIBABA.ACCESS_KEY_SECRET;
    
    return NextResponse.json({
      service: 'handwriting-ocr',
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        hasAccessKeyId,
        hasAccessKeySecret,
        endpoint: 'ocr-api.cn-hangzhou.aliyuncs.com',
        region: 'cn-hangzhou',
        apiVersion: '2021-07-07'
      },
      ready: hasAccessKeyId && hasAccessKeySecret
    });
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    return NextResponse.json(
      {
        service: 'handwriting-ocr',
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}