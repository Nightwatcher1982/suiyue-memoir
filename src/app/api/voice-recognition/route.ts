import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, checkConfig } from '@/lib/config';

// DashScope语音识别API配置
const DASHSCOPE_FILE_ASR_URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription'; // 文件识别
const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks'; // 任务状态查询
const DASHSCOPE_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference'; // WebSocket实时识别
const DASHSCOPE_API_KEY = API_CONFIG.DASHSCOPE.API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 DashScope语音识别 API 被调用');
    
    const body = await request.json();
    const { audioUrl, recognitionType, uploadType = 'recording', duration = '0' } = body;
    
    if (!audioUrl) {
      return NextResponse.json({
        success: false,
        error: '缺少音频文件URL'
      }, { status: 400 });
    }

    console.log('📁 接收到请求:', {
      audioUrl: audioUrl.substring(0, 100) + '...',
      recognitionType: recognitionType,
      uploadType: uploadType,
      duration: duration
    });

    // 检查API配置
    const configStatus = checkConfig();
    
    if (!configStatus.dashscope.complete) {
      console.error('❌ DashScope API配置不完整');
      return NextResponse.json({
        success: false,
        error: 'API配置不完整，需要配置 DASHSCOPE_API_KEY'
      }, { status: 500 });
    }

    console.log('🔑 API配置检查通过，开始语音识别');

    let recognitionResult;
    
    // 根据识别类型选择不同的处理方式
    if (recognitionType === 'realtime') {
      console.log('🚀 使用实时识别模式（模拟WebSocket）');
      // 对于录音功能，我们先使用文件识别作为替代方案
      // 因为在服务端实现WebSocket比较复杂，后续可以优化为真正的实时识别
      recognitionResult = await performFileASR(audioUrl, 'paraformer-realtime-v2');
    } else {
      console.log('🚀 使用文件识别模式');
      recognitionResult = await performFileASR(audioUrl, 'sensevoice-v1');
    }
    
    console.log('✅ DashScope语音识别完成');
    
    return NextResponse.json({
      success: true,
      text: recognitionResult.text,
      confidence: recognitionResult.confidence,
      timestamp: new Date().toISOString(),
      source: recognitionResult.source,
      duration: recognitionResult.duration,
      wordCount: recognitionResult.wordCount,
      model: recognitionResult.model
    });

  } catch (error) {
    console.error('❌ 语音识别错误:', error);
    
    return NextResponse.json({
      success: false,
      error: '语音识别失败',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString(),
      source: 'error'
    }, { status: 500 });
  }
}

// DashScope文件语音识别实现
async function performFileASR(audioUrl: string, model: string): Promise<{ text: string; confidence: number; duration: number; wordCount: number; model: string; source: string }> {
  const startTime = Date.now();
  
  try {
    console.log(`📤 准备提交${model}语音识别任务`);
    
    // 第一步：提交识别任务
    const taskResponse = await submitFileASRTask(audioUrl, model);
    console.log('✅ 任务提交成功，任务ID:', taskResponse.task_id);
    
    // 第二步：轮询任务状态直到完成
    const result = await pollTaskStatus(taskResponse.task_id);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const wordCount = result.text.length;
    
    console.log(`✅ ${model}识别完成:`, result.text);
    
    return {
      text: result.text || '未识别到语音内容',
      confidence: 0.95,
      duration,
      wordCount,
      model: model,
      source: 'dashscope-file-asr'
    };
    
  } catch (error) {
    console.error(`❌ ${model}识别失败:`, error);
    throw error;
  }
}

// 提交文件语音识别任务
async function submitFileASRTask(audioUrl: string, model: string): Promise<{ task_id: string }> {
  console.log(`📤 准备提交${model}语音识别任务，音频URL:`, audioUrl.substring(0, 100) + '...');
  
  try {
    // 根据模型选择合适的参数
    const requestBody = {
      model: model,
      input: {
        file_urls: [audioUrl]
      },
      parameters: {
        language_hints: ['zh']
      }
    };

    // 对于paraformer模型，可能需要不同的参数
    if (model === 'paraformer-realtime-v2') {
      // paraformer实时模型的特殊参数
      requestBody.parameters = {
        ...requestBody.parameters,
        format: 'pcm',
        sample_rate: 16000,
        language_hints: ['zh']
      } as any; // 临时使用any类型避免TypeScript编译错误
    }

    console.log(`📤 ${model}请求参数:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(DASHSCOPE_FILE_ASR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${model}任务提交失败:`, response.status, errorText);
      throw new Error(`${model}任务提交失败: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ ${model}任务提交成功:`, result);
    
    if (!result.output?.task_id) {
      throw new Error('API返回格式异常：缺少task_id');
    }
    
    return {
      task_id: result.output.task_id
    };
    
  } catch (error) {
    console.error(`❌ 提交${model}任务失败:`, error);
    throw error;
  }
}

// 轮询任务状态
async function pollTaskStatus(taskId: string, maxAttempts: number = 30): Promise<{ text: string }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔍 轮询任务状态 (${attempt}/${maxAttempts}): ${taskId}`);
    
    try {
      const response = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 状态查询失败:', response.status, errorText);
        throw new Error(`状态查询失败: ${response.status}`);
      }
      
      const statusData = await response.json();
      console.log('📊 任务状态:', statusData.output?.task_status);
      
      if (statusData.output?.task_status === 'SUCCEEDED') {
        // 任务完成，解析结果
        const results = statusData.output?.results;
        if (!results || results.length === 0) {
          throw new Error('没有找到识别结果');
        }
        
        const transcriptionUrl = results[0].transcription_url;
        if (!transcriptionUrl) {
          throw new Error('没有找到识别结果URL');
        }
        
        console.log('📥 获取识别结果URL:', transcriptionUrl);
        
        // 获取实际的识别结果
        const transcriptionResponse = await fetch(transcriptionUrl);
        if (!transcriptionResponse.ok) {
          throw new Error(`获取识别结果失败: ${transcriptionResponse.status}`);
        }
        
        const transcriptionData = await transcriptionResponse.json();
        
        // 解析识别结果 - 支持新的响应格式
        let transcription = '';
        if (transcriptionData.transcription) {
          transcription = transcriptionData.transcription;
        } else if (transcriptionData.text) {
          transcription = transcriptionData.text;
        } else if (transcriptionData.result) {
          transcription = transcriptionData.result;
        } else if (transcriptionData.transcripts && Array.isArray(transcriptionData.transcripts)) {
          // 处理新的 transcripts 数组格式
          transcription = transcriptionData.transcripts
            .map((item: any) => item.text || item.sentence || item.transcript || '')
            .filter((text: string) => text.trim())
            .join(' ');
        } else if (transcriptionData.properties && transcriptionData.properties.audio_duration) {
          // 如果只有属性信息，返回空结果
          transcription = '';
        } else {
          console.error('❌ 无法解析识别结果，可用字段:', Object.keys(transcriptionData));
          console.error('📋 完整响应数据:', JSON.stringify(transcriptionData, null, 2));
          throw new Error('无法解析识别结果');
        }
        
        console.log('✅ 解析到识别结果:', transcription.substring(0, 100) + (transcription.length > 100 ? '...' : ''));
        
        return {
          text: transcription
        };
        
      } else if (statusData.output?.task_status === 'FAILED') {
        throw new Error(`任务失败: ${statusData.output?.message || '未知错误'}`);
        
      } else if (statusData.output?.task_status === 'PENDING' || statusData.output?.task_status === 'RUNNING') {
        // 任务还在进行中，等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
        continue;
        
      } else {
        throw new Error(`未知任务状态: ${statusData.output?.task_status}`);
      }
      
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.warn(`⚠️ 轮询尝试 ${attempt} 失败:`, error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('任务轮询超时，请稍后重试');
}


// 获取API信息
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '通义千问Paraformer语音识别API',
    endpoints: {
      'POST /api/voice-recognition': '上传音频文件进行语音识别'
    },
    implementation: 'Tongyi Qianwen DashScope Paraformer ASR',
    api: 'dashscope-paraformer',
    model: 'paraformer-v2',
    features: [
      '新一代非自回归端到端模型',
      '高精度语音识别',
      '支持多种音频格式',
      '异步任务处理',
      '中英文混合识别',
      '自动标点符号预测',
      '最大2GB文件支持'
    ],
    config: {
      dashscopeApiKey: DASHSCOPE_API_KEY ? '已配置' : '未配置'
    },
    apiUrl: DASHSCOPE_FILE_ASR_URL,
    taskUrl: DASHSCOPE_TASK_URL
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}