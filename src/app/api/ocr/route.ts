import { NextRequest, NextResponse } from 'next/server';
import Client from '@alicloud/openapi-client';

// 阿里云OCR配置
const ALIBABA_ACCESS_KEY_ID = process.env.ALIBABA_ACCESS_KEY_ID;
const ALIBABA_ACCESS_KEY_SECRET = process.env.ALIBABA_ACCESS_KEY_SECRET;
const OCR_ENDPOINT = 'https://ocr-api.cn-hangzhou.aliyuncs.com';
const OCR_REGION = 'cn-hangzhou';

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
    
    // 检查环境变量配置
    console.log('🔍 检查阿里云OCR配置:');
    console.log('- ALIBABA_ACCESS_KEY_ID:', ALIBABA_ACCESS_KEY_ID ? '已配置' : '未配置');
    console.log('- ALIBABA_ACCESS_KEY_SECRET:', ALIBABA_ACCESS_KEY_SECRET ? '已配置' : '未配置');
    
    // 如果配置了阿里云密钥，使用真实OCR服务
    if (ALIBABA_ACCESS_KEY_ID && ALIBABA_ACCESS_KEY_SECRET) {
      try {
        console.log('🚀 使用阿里云OCR真实服务');
        ocrResult = await performAlibabaOCR(base64Image);
        console.log('✅ 阿里云OCR识别完成');
      } catch (error) {
        console.error('❌ 阿里云OCR调用失败，回退到模拟服务:', error);
        ocrResult = getMockOCRResult();
        ocrResult.message += ' (阿里云OCR调用失败，使用模拟结果)';
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
  try {
    console.log('🔧 初始化阿里云OCR客户端');
    
    const client = new Client({
      accessKeyId: ALIBABA_ACCESS_KEY_ID,
      accessKeySecret: ALIBABA_ACCESS_KEY_SECRET,
      endpoint: OCR_ENDPOINT,
      apiVersion: '2021-07-07'
    });

    console.log('📤 调用阿里云OCR API');
    
    // 使用正确的阿里云OCR API格式
    const requestParams = {
      RegionId: OCR_REGION,
      ImageURL: `data:image/jpeg;base64,${base64Image}`,
      ImageType: 'BASE64'
    };

    const response = await client.request('RecognizeGeneral', requestParams, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📋 阿里云OCR响应:', JSON.stringify(response, null, 2));

    // 解析阿里云OCR响应
    if (response && response.body) {
      const responseBody = response.body;
      
      // 检查不同可能的响应格式
      let ocrData = null;
      if (responseBody.Data) {
        ocrData = responseBody.Data;
      } else if (responseBody.data) {
        ocrData = responseBody.data;
      } else if (responseBody.Content) {
        ocrData = responseBody.Content;
      }

      if (ocrData) {
        let extractedText = '';
        
        // 处理不同的数据格式
        if (Array.isArray(ocrData)) {
          extractedText = ocrData.map((item: any) => {
            return item.text || item.Text || item.content || item.Content || '';
          }).filter(Boolean).join('\n');
        } else if (typeof ocrData === 'string') {
          extractedText = ocrData;
        } else if (ocrData.content || ocrData.Content) {
          const content = ocrData.content || ocrData.Content;
          if (Array.isArray(content)) {
            extractedText = content.map((item: any) => item.text || item.Text || '').filter(Boolean).join('\n');
          } else {
            extractedText = String(content);
          }
        }

        if (extractedText) {
          return {
            success: true,
            text: extractedText,
            confidence: responseBody.Confidence || responseBody.confidence || 0.9,
            message: '阿里云OCR识别成功',
            rawResponse: responseBody // 保留原始响应用于调试
          };
        }
      }
    }

    throw new Error('阿里云OCR未返回可识别的文本内容');

  } catch (error) {
    console.error('❌ 阿里云OCR调用详细错误:', error);
    throw new Error(`阿里云OCR调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
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