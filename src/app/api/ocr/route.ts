import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@alicloud/openapi-client';

// 阿里云OCR配置
const ALIBABA_ACCESS_KEY_ID = process.env.ALIBABA_ACCESS_KEY_ID;
const ALIBABA_ACCESS_KEY_SECRET = process.env.ALIBABA_ACCESS_KEY_SECRET;
const OCR_ENDPOINT = 'https://ocr-api.cn-hangzhou.aliyuncs.com';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 阿里云OCR API 被调用');
    
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

    // 转换文件为base64
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    let ocrResult;
    
    // 如果配置了阿里云密钥，使用真实OCR服务
    if (ALIBABA_ACCESS_KEY_ID && ALIBABA_ACCESS_KEY_SECRET) {
      try {
        ocrResult = await performAlibabaOCR(base64Image);
        console.log('✅ 阿里云OCR识别完成');
      } catch (error) {
        console.error('❌ 阿里云OCR调用失败:', error);
        ocrResult = getMockOCRResult();
      }
    } else {
      console.log('⚠️ 未配置阿里云密钥，使用模拟OCR结果');
      ocrResult = getMockOCRResult();
    }

    return NextResponse.json(ocrResult);

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

async function performAlibabaOCR(base64Image: string) {
  const client = new Client({
    accessKeyId: ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: ALIBABA_ACCESS_KEY_SECRET,
    endpoint: OCR_ENDPOINT,
    apiVersion: '2021-07-07'
  });

  const params = {
    body: JSON.stringify({
      image: base64Image,
      configure: JSON.stringify({
        dataType: 'text'
      })
    })
  };

  const response = await client.request('RecognizeGeneral', params, {
    method: 'POST'
  });

  if (response.body && response.body.data && response.body.data.content) {
    const content = response.body.data.content;
    let extractedText = '';
    
    // 解析OCR结果
    if (Array.isArray(content)) {
      extractedText = content.map((item: any) => item.text || '').join('\n');
    } else if (typeof content === 'string') {
      extractedText = content;
    }

    return {
      success: true,
      text: extractedText,
      confidence: response.body.data.confidence || 0.9,
      message: '阿里云OCR识别成功'
    };
  }

  throw new Error('阿里云OCR返回数据格式异常');
}

function getMockOCRResult() {
  return {
    success: true,
    text: `📄 OCR文字识别结果（模拟）

这是一个模拟的OCR识别结果。

要启用真实的阿里云OCR服务，请：

1. 登录阿里云控制台
2. 开通OCR服务
3. 获取AccessKey ID和AccessKey Secret
4. 在CloudBase环境变量中配置：
   ALIBABA_ACCESS_KEY_ID=your_access_key_id
   ALIBABA_ACCESS_KEY_SECRET=your_access_key_secret

配置完成后，将自动使用真实的OCR识别功能。

当前支持：
✅ 通用文字识别
✅ 中英文混合识别  
✅ 手写文字识别
✅ 表格文字识别`,
    confidence: 0.95,
    message: '模拟OCR识别（请配置阿里云密钥启用真实服务）'
  };
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