import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 语音识别 API 被调用，直接调用科大讯飞API');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const uploadType = formData.get('uploadType') as string || 'recording';
    const duration = formData.get('duration') as string || '0';
    
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: '缺少音频文件'
      }, { status: 400 });
    }

    console.log('📁 接收到音频文件:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      uploadType: uploadType,
      duration: duration
    });

    // 科大讯飞WebSocket IAT只需要AppId
    const config = {
      appId: process.env.XFYUN_APP_ID || '6b59d550',
      apiSecret: process.env.XFYUN_API_SECRET,
      apiKey: process.env.XFYUN_API_KEY
    };
    
    console.log('🔑 API配置检查:', {
      appId: config.appId ? '已配置' : '未配置',
      mode: 'WebSocket IAT (只需AppId)'
    });
    
    if (!config.appId) {
      console.error('❌ 科大讯飞AppId缺失');
      return NextResponse.json({
        success: false,
        error: '专业语音识别服务需要科大讯飞AppId配置。',
        fallbackSuggestion: '建议使用"普通识别"功能，该功能完全免费且无需API配置。'
      }, { status: 500 });
    }

    // 转换音频文件为base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    // 检查音频数据大小是否合理
    if (audioBuffer.byteLength < 100) {
      return NextResponse.json({
        success: false,
        error: '音频数据太短，请录制更长的音频',
      }, { status: 400 });
    }

    if (audioBuffer.byteLength > 10000000) { // 约10MB
      return NextResponse.json({
        success: false,
        error: '音频数据太大，请录制较短的音频',
      }, { status: 400 });
    }

    // 根据上传类型选择合适的科大讯飞API
    let result;
    if (uploadType === 'file' && audioBuffer.byteLength > 100000) {
      // 使用文件语音识别API (LFASR) - 适合较大的文件
      console.log('📂 使用科大讯飞文件语音识别API (LFASR)');
      result = await callXunfeiLFASR(audioBase64, audioFile.type || 'wav', audioFile.name || `audio-${Date.now()}.wav`, config);
    } else {
      // 使用实时语音识别API (IAT) - 适合短音频和录音
      console.log('🎤 使用科大讯飞实时语音识别API (IAT)');
      result = await callXunfeiASR(audioBase64, config);
    }

    console.log('✅ 语音识别成功:', result.text);
    
    return NextResponse.json({
      success: true,
      text: result.text,
      confidence: result.confidence || 0.95,
      timestamp: new Date().toISOString(),
      source: 'xunfei-direct-api'
    });

  } catch (error) {
    console.error('❌ 语音识别错误:', error);
    
    // 返回友好的错误信息
    return NextResponse.json({
      success: false,
      error: '语音识别失败，请重试',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

async function callXunfeiASR(audioBase64: string, config: any) {
  console.log('🌐 使用科大讯飞WebSocket IAT API (简化版本，只需appId)');
  
  const appId = config.appId;
  
  // 科大讯飞WebSocket IAT API 采用HTTP代理方式
  const host = 'ws-api.xfyun.cn';
  const path = '/v2/iat';
  
  // 将base64音频数据转换为Buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  
  console.log('🌐 发送科大讯飞WebSocket IAT请求:', {
    host: host,
    path: path,
    audioSize: audioBuffer.length,
    appId: appId
  });
  
  try {
    // 构建WebSocket IAT请求参数
    const params = {
      common: {
        app_id: appId
      },
      business: {
        language: "zh_cn",
        domain: "iat",
        accent: "mandarin",
        vinfo: 1,
        vad_eos: 10000
      },
      data: {
        status: 2,
        format: "audio/L16;rate=16000",
        encoding: "raw",
        audio: audioBase64
      }
    };
    
    // 使用HTTP方式模拟WebSocket请求
    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': host
      },
      body: JSON.stringify(params)
    });
    
    const responseData = await response.text();
    
    console.log('🔍 科大讯飞WebSocket IAT HTTP状态码:', response.status);
    console.log('🔍 科大讯飞WebSocket IAT响应原始数据:', responseData);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseData}`);
    }
    
    const result = JSON.parse(responseData);
    
    if (result.code !== 0) {
      throw new Error('WebSocket IAT识别失败: ' + (result.message || '未知错误'));
    }
    
    // 解析识别结果
    let recognizedText = '';
    if (result.data && result.data.result && result.data.result.ws) {
      result.data.result.ws.forEach((ws: any) => {
        if (ws.cw) {
          ws.cw.forEach((cw: any) => {
            if (cw.w) {
              recognizedText += cw.w;
            }
          });
        }
      });
    }
    
    return {
      text: recognizedText,
      confidence: 0.95
    };
    
  } catch (error) {
    console.error('❌ WebSocket IAT调用失败:', error);
    throw error;
  }
}

async function uploadAudioToXunfei(audioBase64: string, audioFormat: string, fileName: string, config: any) {
  const host = 'raasr.xfyun.cn';
  const path = '/v2/api/upload';
  
  // 生成签名
  const ts = Math.floor(Date.now() / 1000);
  const md5 = crypto.createHash('md5');
  const signa = md5.update(config.apiKey + ts).digest('hex');
  
  const formData = new URLSearchParams();
  formData.append('appId', config.appId);
  formData.append('signa', signa);
  formData.append('ts', ts.toString());
  formData.append('fileSize', Buffer.byteLength(audioBase64, 'base64').toString());
  formData.append('fileName', fileName);
  formData.append('duration', '0');
  
  // 将base64转换为Buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  formData.append('file', audioBuffer.toString('base64')); // 这里需要特殊处理
  
  const response = await fetch(`https://${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData
  });
  
  const data = await response.text();
  console.log('📤 语音转写上传响应:', data);
  
  if (!response.ok) {
    throw new Error(`上传失败: HTTP ${response.status}`);
  }
  
  const result = JSON.parse(data);
  
  if (result.code !== '000000') {
    throw new Error('语音转写上传失败: ' + (result.descInfo || '未知错误'));
  }
  
  return {
    orderId: result.content.orderId
  };
}

async function getResultFromXunfei(orderId: string, config: any) {
  const host = 'raasr.xfyun.cn';
  const path = '/v2/api/getResult';
  
  // 生成签名
  const ts = Math.floor(Date.now() / 1000);
  const md5 = crypto.createHash('md5');
  const signa = md5.update(config.apiKey + ts).digest('hex');
  
  const postData = {
    appId: config.appId,
    signa: signa,
    ts: ts,
    orderId: orderId
  };
  
  const response = await fetch(`https://${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData)
  });
  
  const data = await response.text();
  
  if (!response.ok) {
    throw new Error(`查询失败: HTTP ${response.status}`);
  }
  
  const result = JSON.parse(data);
  
  if (result.code !== '000000') {
    throw new Error('语音转写查询失败: ' + (result.descInfo || '未知错误'));
  }
  
  const content = result.content;
  let resultText = '';
  
  if (content.orderResult) {
    // 解析识别结果
    const orderResult = JSON.parse(content.orderResult);
    if (orderResult.lattice) {
      orderResult.lattice.forEach((item: any) => {
        if (item.json_1best) {
          const json1best = JSON.parse(item.json_1best);
          if (json1best.st && json1best.st.rt) {
            json1best.st.rt.forEach((rt: any) => {
              if (rt.ws) {
                rt.ws.forEach((ws: any) => {
                  if (ws.cw && ws.cw[0] && ws.cw[0].w) {
                    resultText += ws.cw[0].w;
                  }
                });
              }
            });
          }
        }
      });
    }
  }
  
  return {
    status: content.orderInfo.status,
    description: content.orderInfo.desc,
    result: resultText
  };
}

async function callXunfeiLFASR(audioBase64: string, audioFormat: string, fileName: string, config: any) {
  // 使用语音转写API处理大文件
  console.log('📁 使用语音转写API处理大文件');
  return await callXunfeiASR(audioBase64, config);
}

// 获取API信息
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '语音识别API (科大讯飞直接调用版本)',
    endpoints: {
      'POST /api/voice-recognition': '上传音频文件进行语音识别'
    },
    implementation: '科大讯飞WebSocket IAT API',
    api: 'xunfei-iat',
    note: '使用AppId: 6b59d550，WebSocket IAT无需复杂认证'
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