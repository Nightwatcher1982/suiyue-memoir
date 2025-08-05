import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription';
const DASHSCOPE_API_KEY = API_CONFIG.DASHSCOPE.API_KEY;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 测试通义千问API连接');
    
    // 测试API密钥和连接
    const testResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ]
        }
      })
    });

    console.log('📋 API测试响应状态:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ API测试失败:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'API连接测试失败',
        status: testResponse.status,
        details: errorText,
        apiKey: DASHSCOPE_API_KEY ? `${DASHSCOPE_API_KEY.substring(0, 4)}****` : '未配置'
      });
    }

    const testData = await testResponse.json();
    console.log('✅ API连接测试成功');

    return NextResponse.json({
      success: true,
      message: 'API连接测试成功',
      apiKey: DASHSCOPE_API_KEY ? `${DASHSCOPE_API_KEY.substring(0, 4)}****` : '未配置',
      testResponse: {
        status: testResponse.status,
        hasOutput: !!testData.output
      }
    });

  } catch (error) {
    console.error('❌ API测试错误:', error);
    
    return NextResponse.json({
      success: false,
      error: 'API测试异常',
      message: error instanceof Error ? error.message : '未知错误',
      apiKey: DASHSCOPE_API_KEY ? `${DASHSCOPE_API_KEY.substring(0, 4)}****` : '未配置'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 测试语音识别API提交');
    
    // 创建一个最小的测试音频数据
    const testAudioData = Buffer.alloc(1000, 0); // 1KB的空数据用于测试
    
    // 测试multipart/form-data格式
    const boundary = '----formdata-test123';
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="model"\r\n\r\n`;
    body += `paraformer-v2\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="language_hints"\r\n\r\n`;
    body += `zh\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="test.wav"\r\n`;
    body += `Content-Type: audio/wav\r\n\r\n`;
    
    const bodyPrefix = Buffer.from(body, 'utf8');
    const bodySuffix = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const fullBody = Buffer.concat([bodyPrefix, testAudioData, bodySuffix]);
    
    console.log('📤 发送测试请求，数据大小:', fullBody.length);
    
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-DashScope-Async': 'enable'
      },
      body: fullBody
    });
    
    console.log('📋 语音API测试响应状态:', response.status);
    
    const responseText = await response.text();
    console.log('📋 语音API响应内容:', responseText);
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseText,
      requestSize: fullBody.length,
      apiUrl: DASHSCOPE_API_URL,
      apiKey: DASHSCOPE_API_KEY ? `${DASHSCOPE_API_KEY.substring(0, 4)}****` : '未配置',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY?.substring(0, 4)}****`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-DashScope-Async': 'enable'
      }
    });

  } catch (error) {
    console.error('❌ 语音API测试错误:', error);
    
    return NextResponse.json({
      success: false,
      error: '语音API测试异常',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}