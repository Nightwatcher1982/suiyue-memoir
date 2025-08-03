import { NextRequest, NextResponse } from 'next/server';
import Ocr20191230, * as $Ocr20191230 from '@alicloud/ocr20191230';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

// 阿里云OCR配置 - 使用2021-07-07版本
const ALIBABA_ACCESS_KEY_ID = process.env.ALIBABA_ACCESS_KEY_ID;
const ALIBABA_ACCESS_KEY_SECRET = process.env.ALIBABA_ACCESS_KEY_SECRET;
const OCR_ENDPOINT = 'ocr-api.cn-hangzhou.aliyuncs.com';
const OCR_REGION = 'cn-hangzhou';
const API_VERSION = '2021-07-07';

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
    console.log('- ALIBABA_ACCESS_KEY_ID:', ALIBABA_ACCESS_KEY_ID ? `已配置 (${ALIBABA_ACCESS_KEY_ID.substring(0, 8)}...)` : '未配置');
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
  // 直接使用SDK方式，因为HTTP签名比较复杂
  console.log('🔧 使用阿里云OCR OpenAPI SDK方式');
  return await performAlibabaOCRWithSDK(base64Image);
}

async function performAlibabaOCRWithSDK(base64Image: string) {
  try {
    console.log('🔧 使用阿里云OCR OpenAPI 2021-07-07 SDK方式');
    console.log('📊 详细配置信息:');
    console.log('- AccessKeyId:', ALIBABA_ACCESS_KEY_ID ? `${ALIBABA_ACCESS_KEY_ID.substring(0, 8)}...` : 'undefined');
    console.log('- AccessKeySecret:', ALIBABA_ACCESS_KEY_SECRET ? `${ALIBABA_ACCESS_KEY_SECRET.substring(0, 4)}...` : 'undefined');
    console.log('- Endpoint:', OCR_ENDPOINT);
    console.log('- Region:', OCR_REGION);
    console.log('- API Version:', API_VERSION);
    console.log('- 图片大小:', `${Math.round(base64Image.length / 1024)}KB`);
    
    // 创建配置对象 - 使用标准的阿里云OpenAPI配置
    const config = new $OpenApi.Config({
      accessKeyId: ALIBABA_ACCESS_KEY_ID,
      accessKeySecret: ALIBABA_ACCESS_KEY_SECRET,
      regionId: OCR_REGION,
    });
    // 设置正确的endpoint
    config.endpoint = OCR_ENDPOINT;
    
    console.log('✅ 配置对象创建成功');
    
    // 创建OCR客户端 - 使用现有的SDK但配置为兼容模式
    const client = new Ocr20191230(config);
    console.log('✅ OCR客户端创建成功');

    console.log('📤 调用阿里云OCR API - RecognizeGeneral (通用文字识别)');
    
    try {
      // 使用通用文字识别API - 这是推荐的方式
      // 检查是否有RecognizeGeneral方法
      if (typeof (client as any).recognizeGeneral === 'function') {
        console.log('✅ 发现RecognizeGeneral方法，使用通用文字识别');
        const recognizeRequest = {
          imageURL: `data:image/jpeg;base64,${base64Image}`,
        };
        
        console.log('📤 发送RecognizeGeneral请求...');
        const response = await (client as any).recognizeGeneral(recognizeRequest);
        console.log('📋 RecognizeGeneral响应:', JSON.stringify(response, null, 2));
        
        return await parseOCRResponse(response, 'RecognizeGeneral');
        
      } else {
        // 后备方案：使用RecognizeCharacter
        console.log('⚠️ RecognizeGeneral方法不存在，使用RecognizeCharacter后备方案');
        const recognizeRequest = new $Ocr20191230.RecognizeCharacterRequest({
          imageURL: `data:image/jpeg;base64,${base64Image}`,
          minHeight: 16,
          outputProbability: true
        });

        console.log('📤 发送RecognizeCharacter请求...');
        console.log('📤 请求参数:', {
          imageURL: `data:image/jpeg;base64,${base64Image.substring(0, 50)}...`,
          minHeight: 16,
          outputProbability: true
        });
        
        const response = await client.recognizeCharacter(recognizeRequest);
        console.log('📋 RecognizeCharacter响应状态:', response.statusCode);
        console.log('📋 RecognizeCharacter响应头:', JSON.stringify(response.headers, null, 2));
        console.log('📋 RecognizeCharacter响应体:', JSON.stringify(response.body, null, 2));
        
        return await parseOCRResponse(response, 'RecognizeCharacter');
      }
      
    } catch (sdkError) {
      console.error('❌ OCR SDK调用详细错误信息:');
      console.error('- 错误类型:', typeof sdkError);
      console.error('- 错误对象:', sdkError);
      console.error('- 错误消息:', sdkError instanceof Error ? sdkError.message : '未知错误');
      console.error('- 错误堆栈:', sdkError instanceof Error ? sdkError.stack : '无堆栈信息');
      
      // 如果是网络错误，提供更多信息
      if (sdkError && typeof sdkError === 'object') {
        const errorObj = sdkError as any;
        if (errorObj.code) console.error('- 错误代码:', errorObj.code);
        if (errorObj.statusCode) console.error('- HTTP状态码:', errorObj.statusCode);
        if (errorObj.data) console.error('- 错误数据:', JSON.stringify(errorObj.data, null, 2));
        if (errorObj.requestId) console.error('- 请求ID:', errorObj.requestId);
      }
      
      // 提供更具体的错误信息
      if (sdkError instanceof Error) {
        if (sdkError.message.includes('InvalidVersion')) {
          throw new Error('OCR服务版本不匹配，请检查服务是否正确开通 (2021-07-07版本)');
        }
        if (sdkError.message.includes('InvalidAccessKeyId')) {
          throw new Error('AccessKey ID无效，请检查配置');
        }
        if (sdkError.message.includes('SignatureDoesNotMatch')) {
          throw new Error('AccessKey Secret无效，请检查配置');
        }
        if (sdkError.message.includes('Forbidden')) {
          throw new Error('权限不足，请确认AccessKey有OCR服务权限');
        }
        if (sdkError.message.includes('ReadTimeout') || sdkError.message.includes('timeout')) {
          throw new Error('网络超时，请检查网络连接或阿里云服务状态');
        }
      }
      
      throw sdkError;
    }

  } catch (error) {
    console.error('❌ 阿里云OCR SDK调用详细错误:', error);
    throw new Error(`阿里云OCR调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 解析OCR响应的通用函数
async function parseOCRResponse(response: any, method: string) {
  console.log('🔍 开始解析OCR响应...');
  console.log('- 方法:', method);
  console.log('- 响应类型:', typeof response);
  console.log('- 响应结构:', Object.keys(response || {}));
  
  if (response && response.body) {
    console.log('✅ 响应体存在');
    console.log('- 响应体类型:', typeof response.body);
    console.log('- 响应体结构:', Object.keys(response.body || {}));
    
    if (response.body.data) {
      console.log('✅ data字段存在');
      const data = response.body.data;
      console.log('- data类型:', typeof data);
      console.log('- data结构:', Object.keys(data || {}));
      console.log('- data内容:', JSON.stringify(data, null, 2));
      
      let extractedText = '';
      let totalConfidence = 0;
      
      // 处理不同API的响应格式
      if (method === 'RecognizeGeneral' && data.content) {
        console.log('✅ 使用RecognizeGeneral格式解析');
        extractedText = data.content;
        totalConfidence = data.confidence || 0.9;
      } else if (data.results && Array.isArray(data.results)) {
        console.log('✅ 使用results数组格式解析');
        console.log('- results长度:', data.results.length);
        const validResults = data.results.filter((item: any) => item.text);
        console.log('- 有效results:', validResults.length);
        extractedText = validResults.map((item: any) => item.text || '').join('\n');
        
        if (validResults.length > 0) {
          totalConfidence = validResults.reduce((sum: number, item: any) => 
            sum + (item.probability || 0.9), 0) / validResults.length;
        }
      } else if (data.content) {
        console.log('✅ 使用通用content格式解析');
        extractedText = data.content;
        totalConfidence = data.confidence || 0.9;
      } else {
        console.log('❌ 未找到可识别的数据格式');
        console.log('- data完整内容:', JSON.stringify(data, null, 2));
      }

      console.log('📝 解析结果:');
      console.log('- 提取的文本长度:', extractedText.length);
      console.log('- 提取的文本:', extractedText.substring(0, 100) + (extractedText.length > 100 ? '...' : ''));
      console.log('- 置信度:', totalConfidence);

      if (extractedText) {
        console.log('✅ OCR解析成功');
        return {
          success: true,
          text: extractedText,
          confidence: totalConfidence || 0.9,
          message: `阿里云OCR识别成功 (${method})`,
          rawResponse: response.body
        };
      }
    } else {
      console.log('❌ 响应体中缺少data字段');
      console.log('- 完整响应体:', JSON.stringify(response.body, null, 2));
    }
  } else {
    console.log('❌ 响应或响应体为空');
    console.log('- 完整响应:', JSON.stringify(response, null, 2));
  }
  
  console.log('❌ OCR响应解析失败');
  throw new Error(`阿里云OCR ${method} 未返回可识别的文本内容`);
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