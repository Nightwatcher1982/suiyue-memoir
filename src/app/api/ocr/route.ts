import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 OCR API 被调用');
    
    // 检查请求内容类型
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: '请求必须是 multipart/form-data 格式' },
        { status: 400 }
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '未找到图片文件' },
        { status: 400 }
      );
    }

    console.log('📷 接收到图片文件:', file.name, file.size);

    // 目前返回模拟的OCR结果
    // TODO: 集成真实的OCR服务（百度OCR、腾讯OCR等）
    const mockOcrResult = {
      success: true,
      text: '这是模拟的OCR识别结果。\n\n请在代码中配置真实的OCR服务API Key，以获得实际的文字识别功能。\n\n支持的OCR服务：\n- 百度智能云OCR\n- 腾讯云OCR\n- 阿里云OCR\n- Google Vision API',
      confidence: 0.95,
      regions: [
        {
          text: '这是模拟的OCR识别结果。',
          boundingBox: [10, 10, 200, 30]
        },
        {
          text: '请在代码中配置真实的OCR服务API Key，以获得实际的文字识别功能。',
          boundingBox: [10, 40, 400, 60]
        }
      ]
    };

    console.log('✅ OCR处理完成');
    return NextResponse.json(mockOcrResult);

  } catch (error) {
    console.error('❌ OCR API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'OCR处理失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求（用于CORS预检）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}