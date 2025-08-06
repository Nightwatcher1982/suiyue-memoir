import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { API_CONFIG } from '@/lib/config';

// 阿里云手写体识别OCR配置 - 使用2021-07-07版本
const ALIBABA_ACCESS_KEY_ID = API_CONFIG.ALIBABA.ACCESS_KEY_ID;
const ALIBABA_ACCESS_KEY_SECRET = API_CONFIG.ALIBABA.ACCESS_KEY_SECRET;
const OCR_ENDPOINT = 'ocr-api.cn-hangzhou.aliyuncs.com';
const OCR_REGION = 'cn-hangzhou';
const API_VERSION = '2021-07-07';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 阿里云手写体识别 API 被调用');
    
    // 检查环境变量配置
    if (!ALIBABA_ACCESS_KEY_ID || !ALIBABA_ACCESS_KEY_SECRET) {
      return NextResponse.json(
        { 
          success: false,
          error: '阿里云手写体识别服务未配置',
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

    console.log('📷 接收到手写体图片文件:', file.name, file.size);

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

    console.log('🚀 调用阿里云手写体识别真实服务');
    const ocrResult = await performAlibabaHandwritingOCR(base64Image);
    console.log('✅ 阿里云手写体识别完成');

    return NextResponse.json(ocrResult);

  } catch (error) {
    console.error('❌ 手写体识别 API错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '手写体识别处理失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

async function performAlibabaHandwritingOCR(base64Image: string) {
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();
  
  // 构建请求参数 - 使用RecognizeHandwriting接口
  const params: Record<string, string> = {
    Action: 'RecognizeHandwriting',
    Version: API_VERSION,
    RegionId: OCR_REGION,
    AccessKeyId: ALIBABA_ACCESS_KEY_ID!,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: timestamp,
    SignatureVersion: '1.0',
    SignatureNonce: nonce,
    Format: 'JSON',
    // 手写体识别特有参数
    OutputCharInfo: 'true',  // 输出字符坐标信息
    OutputTable: 'false',    // 不需要表格信息
    NeedRotate: 'true'       // 自动旋转图片
  };

  // 生成签名
  const signature = generateSignature(params, ALIBABA_ACCESS_KEY_SECRET!);
  params.Signature = signature;

  console.log('📤 发送阿里云手写体识别请求');
  console.log('- Endpoint:', `https://${OCR_ENDPOINT}`);
  console.log('- Action:', params.Action);
  console.log('- Version:', params.Version);
  console.log('- 图片大小:', `${Math.round(base64Image.length / 1024)}KB`);

  try {
    // 将参数拼接到URL查询字符串中
    const queryString = new URLSearchParams(params).toString();
    
    // 图片数据直接作为请求body发送
    const imageBuffer = Buffer.from(base64Image, 'base64');

    const response = await fetch(`https://${OCR_ENDPOINT}?${queryString}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json'
      },
      body: imageBuffer
    });

    console.log('📋 手写体识别响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 手写体识别HTTP错误:', response.status, errorText);
      throw new Error(`阿里云手写体识别HTTP错误: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('📋 手写体识别响应数据:', JSON.stringify(responseData, null, 2));

    return parseHandwritingOCRResponse(responseData);

  } catch (error) {
    console.error('❌ 阿里云手写体识别调用失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('InvalidAccessKeyId')) {
        throw new Error('AccessKey ID无效，请检查配置');
      }
      if (error.message.includes('SignatureDoesNotMatch')) {
        throw new Error('AccessKey Secret无效，请检查配置');
      }
      if (error.message.includes('Forbidden')) {
        throw new Error('权限不足，请确认AccessKey有手写体识别服务权限');
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

  console.log('🔐 手写体识别签名生成完成');
  return signature;
}

function parseHandwritingOCRResponse(responseData: any) {
  console.log('🔍 解析手写体识别响应...');
  
  // 检查是否有错误
  if (responseData.Code && responseData.Code !== 'Success') {
    console.error('❌ 手写体识别失败:', responseData.Code, responseData.Message);
    throw new Error(`手写体识别失败: ${responseData.Message || responseData.Code}`);
  }

  // 解析识别结果 - Data字段是JSON字符串，需要解析
  if (responseData.Data) {
    let dataObj;
    try {
      dataObj = typeof responseData.Data === 'string' ? JSON.parse(responseData.Data) : responseData.Data;
    } catch (error) {
      console.error('❌ 解析手写体识别Data字段失败:', error);
      throw new Error('解析手写体识别响应数据失败');
    }

    if (dataObj.content) {
      const extractedText = dataObj.content.trim();
      console.log('✅ 手写体识别解析成功');
      console.log('- 提取的文本长度:', extractedText.length);
      console.log('- 提取的文本:', extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''));

      return {
        success: true,
        text: extractedText,
        confidence: 0.98, // 手写体识别通常有很高的准确率
        message: '阿里云手写体识别成功',
        requestId: responseData.RequestId,
        recognitionType: 'handwriting', // 标识为手写体识别
        details: {
          wordCount: dataObj.prism_wnum || 0,
          wordsInfo: dataObj.prism_wordsInfo || [],
          characterInfo: dataObj.prism_charInfo || [] // 字符级别信息
        }
      };
    }
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
      console.log('✅ 手写体识别解析成功（通过prism_wordsInfo）');
      return {
        success: true,
        text: extractedText,
        confidence: 0.98,
        message: '阿里云手写体识别成功',
        requestId: responseData.RequestId,
        recognitionType: 'handwriting'
      };
    }
  }

  console.log('❌ 未找到可识别的手写体文本内容');
  console.log('- 完整响应:', JSON.stringify(responseData, null, 2));
  throw new Error('手写体识别未识别到文本内容');
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