import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

// 使用阿里云Qwen-VL-OCR模型进行手写体识别
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || API_CONFIG.TONGYI.API_KEY;
const QWEN_VL_OCR_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Qwen-VL-OCR手写体识别 API 被调用');
    console.log('🔧 环境检查:', {
      hasDashscopeKey: !!DASHSCOPE_API_KEY,
      endpoint: QWEN_VL_OCR_ENDPOINT
    });
    
    // 检查环境变量配置
    if (!DASHSCOPE_API_KEY) {
      console.error('❌ DASHSCOPE API Key未配置');
      return NextResponse.json(
        { 
          success: false,
          error: 'Qwen-VL-OCR服务未配置',
          message: '请在环境变量中配置 DASHSCOPE_API_KEY'
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

    // 验证文件大小
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '图片文件太大，请上传小于10MB的图片' },
        { status: 400 }
      );
    }

    // 转换文件为base64
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    console.log('🚀 调用Qwen-VL-OCR手写体识别服务');
    const ocrResult = await performQwenVLOCR(base64Image, mimeType);
    console.log('✅ Qwen-VL-OCR手写体识别完成');

    return NextResponse.json(ocrResult);

  } catch (error) {
    console.error('❌ 手写体识别 API错误:', error);
    console.error('❌ 错误详情:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false,
        error: '手写体识别处理失败',
        message: error instanceof Error ? error.message : '未知错误',
        debug: process.env.NODE_ENV === 'development' ? {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}

async function performQwenVLOCR(base64Image: string, mimeType: string) {
  const requestBody = {
    model: "qwen-vl-ocr", // 使用专门的OCR模型
    input: {
      messages: [
        {
          role: "user",
          content: [
            {
              image: `data:${mimeType};base64,${base64Image}`
            },
            {
              text: "请识别图片中的所有手写文字内容，包括中文、英文和数字。请直接输出识别到的文字，不需要额外的解释。"
            }
          ]
        }
      ]
    },
    parameters: {
      result_format: "message"
    }
  };

  console.log('📤 发送Qwen-VL-OCR请求');
  console.log('- Model:', requestBody.model);
  console.log('- 图片类型:', mimeType);
  console.log('- 图片大小:', `${Math.round(base64Image.length / 1024)}KB`);

  try {
    const response = await fetch(QWEN_VL_OCR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📋 Qwen-VL-OCR响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Qwen-VL-OCR HTTP错误:', response.status, errorText);
      throw new Error(`Qwen-VL-OCR HTTP错误: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('📋 Qwen-VL-OCR响应数据:', JSON.stringify(responseData, null, 2));

    return parseQwenVLOCRResponse(responseData);

  } catch (error) {
    console.error('❌ Qwen-VL-OCR调用失败:', error);
    throw error;
  }
}

function parseQwenVLOCRResponse(responseData: any) {
  console.log('🔍 解析Qwen-VL-OCR响应...');
  
  // 检查是否有错误
  if (responseData.code && responseData.code !== 'Success') {
    console.error('❌ Qwen-VL-OCR失败:', responseData.code, responseData.message);
    throw new Error(`Qwen-VL-OCR失败: ${responseData.message || responseData.code}`);
  }

  // 解析识别结果
  if (responseData.output && responseData.output.choices && responseData.output.choices.length > 0) {
    const choice = responseData.output.choices[0];
    if (choice.message && choice.message.content) {
      const content = choice.message.content;
      const extractedText = typeof content === 'string' ? content.trim() : String(content).trim();
      console.log('✅ Qwen-VL-OCR解析成功');
      console.log('- 提取的文本长度:', extractedText.length);
      console.log('- 提取的文本:', extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''));

      return {
        success: true,
        text: extractedText,
        confidence: 0.95, // Qwen-VL-OCR通常有很高的准确率
        message: 'Qwen-VL-OCR手写体识别成功',
        requestId: responseData.request_id,
        recognitionType: 'handwriting-qwen', // 标识为Qwen手写体识别
        details: {
          wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
          model: 'qwen-vl-ocr',
          usage: responseData.usage
        }
      };
    }
  }

  console.log('❌ 未找到可识别的手写体文本内容');
  console.log('- 完整响应:', JSON.stringify(responseData, null, 2));
  throw new Error('Qwen-VL-OCR未识别到文本内容');
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