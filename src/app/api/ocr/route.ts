import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 阿里云OCR配置 - 使用2021-07-07版本
const ALIBABA_ACCESS_KEY_ID = process.env.ALIBABA_ACCESS_KEY_ID;
const ALIBABA_ACCESS_KEY_SECRET = process.env.ALIBABA_ACCESS_KEY_SECRET;
const OCR_ENDPOINT = 'ocr-api.cn-hangzhou.aliyuncs.com';
const OCR_REGION = 'cn-hangzhou';
const API_VERSION = '2021-07-07';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 阿里云OCR API 被调用');
    
    // 检查环境变量配置
    if (!ALIBABA_ACCESS_KEY_ID || !ALIBABA_ACCESS_KEY_SECRET) {
      return NextResponse.json(
        { 
          success: false,
          error: '阿里云OCR服务未配置',
          message: '请在环境变量中配置 ALIBABA_ACCESS_KEY_ID 和 ALIBABA_ACCESS_KEY_SECRET'
        },
        { status: 400 }
      );
    }

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

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '图片文件太大，请上传小于10MB的图片' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/bmp', 'image/gif', 'image/tiff', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的图片格式，请上传PNG、JPG、JPEG、BMP、GIF、TIFF或WebP格式的图片' },
        { status: 400 }
      );
    }

    // 转换文件为base64
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    console.log('🚀 调用阿里云OCR真实服务');
    const ocrResult = await performAlibabaOCR(base64Image);
    console.log('✅ 阿里云OCR识别完成');

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
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();
  
  // 构建请求参数
  const params: Record<string, string> = {
    Action: 'RecognizeGeneral',
    Version: API_VERSION,
    RegionId: OCR_REGION,
    AccessKeyId: ALIBABA_ACCESS_KEY_ID!,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: timestamp,
    SignatureVersion: '1.0',
    SignatureNonce: nonce,
    Format: 'JSON',
    Body: base64Image
  };

  // 生成签名
  const signature = generateSignature(params, ALIBABA_ACCESS_KEY_SECRET!);
  params.Signature = signature;

  console.log('📤 发送阿里云OCR请求');
  console.log('- Endpoint:', `https://${OCR_ENDPOINT}`);
  console.log('- Action:', params.Action);
  console.log('- Version:', params.Version);
  console.log('- 图片大小:', `${Math.round(base64Image.length / 1024)}KB`);

  try {
    const response = await fetch(`https://${OCR_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(params).toString()
    });

    console.log('📋 OCR响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OCR HTTP错误:', response.status, errorText);
      throw new Error(`阿里云OCR HTTP错误: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('📋 OCR响应数据:', JSON.stringify(responseData, null, 2));

    return parseOCRResponse(responseData);

  } catch (error) {
    console.error('❌ 阿里云OCR调用失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('InvalidAccessKeyId')) {
        throw new Error('AccessKey ID无效，请检查配置');
      }
      if (error.message.includes('SignatureDoesNotMatch')) {
        throw new Error('AccessKey Secret无效，请检查配置');
      }
      if (error.message.includes('Forbidden')) {
        throw new Error('权限不足，请确认AccessKey有OCR服务权限');
      }
      if (error.message.includes('timeout')) {
        throw new Error('网络超时，请检查网络连接');
      }
    }
    
    throw error;
  }
}

function generateSignature(params: Record<string, string>, accessKeySecret: string): string {
  // 按字典序排序参数
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'Signature')
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // 构建签名字符串
  const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`;
  
  // 生成签名
  const signature = crypto
    .createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64');

  console.log('🔐 签名生成完成');
  return signature;
}

function parseOCRResponse(responseData: any) {
  console.log('🔍 解析OCR响应...');
  
  // 检查是否有错误
  if (responseData.Code && responseData.Code !== 'Success') {
    console.error('❌ OCR识别失败:', responseData.Code, responseData.Message);
    throw new Error(`OCR识别失败: ${responseData.Message || responseData.Code}`);
  }

  // 解析识别结果
  if (responseData.Data && responseData.Data.content) {
    const extractedText = responseData.Data.content;
    console.log('✅ OCR解析成功');
    console.log('- 提取的文本长度:', extractedText.length);
    console.log('- 提取的文本:', extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''));

    return {
      success: true,
      text: extractedText,
      confidence: 0.95, // 阿里云OCR通常有很高的准确率
      message: '阿里云OCR识别成功',
      requestId: responseData.RequestId
    };
  }

  // 如果有详细的文字块信息
  if (responseData.Data && responseData.Data.prism_wordsInfo) {
    const wordsInfo = responseData.Data.prism_wordsInfo;
    let extractedText = '';
    
    if (Array.isArray(wordsInfo)) {
      extractedText = wordsInfo
        .map((word: any) => word.word || word.text || '')
        .filter(text => text.trim())
        .join(' ');
    }

    if (extractedText) {
      console.log('✅ OCR解析成功（通过prism_wordsInfo）');
      return {
        success: true,
        text: extractedText,
        confidence: 0.95,
        message: '阿里云OCR识别成功',
        requestId: responseData.RequestId
      };
    }
  }

  console.log('❌ 未找到可识别的文本内容');
  console.log('- 完整响应:', JSON.stringify(responseData, null, 2));
  throw new Error('OCR未识别到文本内容');
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