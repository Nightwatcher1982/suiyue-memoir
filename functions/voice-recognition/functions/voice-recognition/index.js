const cloudbase = require('@cloudbase/node-sdk');
const crypto = require('crypto');

// 初始化CloudBase
const cloud = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

/**
 * 科大讯飞语音识别云函数
 */
exports.main = async (event, context) => {
  console.log('🎤 科大讯飞语音识别云函数启动');
  console.log('📝 接收到的事件数据:', JSON.stringify(event, null, 2));

  try {
    // 从环境变量获取API凭证
    const config = {
      appId: process.env.XUNFEI_APP_ID,
      apiSecret: process.env.XUNFEI_API_SECRET,
      apiKey: process.env.XUNFEI_API_KEY
    };
    
    console.log('🔑 API配置检查:', {
      appId: config.appId ? '已配置' : '未配置',
      apiSecret: config.apiSecret ? '已配置' : '未配置',
      apiKey: config.apiKey ? '已配置' : '未配置'
    });
    
    if (!config.appId || !config.apiSecret || !config.apiKey) {
      console.error('❌ 科大讯飞API配置缺失');
      return {
        success: false,
        error: '语音识别服务配置缺失，请检查环境变量配置',
        timestamp: new Date().toISOString(),
        source: 'xunfei-cloud-function'
      };
    }

    // 从事件中获取音频数据和类型
    const audioData = event.audioData;
    const audioFormat = event.audioFormat || 'wav';
    const uploadType = event.uploadType || 'recording'; // 'recording' 或 'file'
    const fileName = event.fileName || `audio-${Date.now()}.${audioFormat}`;
    
    if (!audioData) {
      return {
        success: false,
        error: '缺少音频数据',
        timestamp: new Date().toISOString(),
        source: 'xunfei-cloud-function'
      };
    }

    console.log('📁 接收到音频数据:', {
      format: audioFormat,
      size: audioData.length,
      type: typeof audioData,
      uploadType: uploadType,
      fileName: fileName
    });

    // 检查音频数据大小是否合理
    if (audioData.length < 100) {
      return {
        success: false,
        error: '音频数据太短，请录制更长的音频',
        timestamp: new Date().toISOString(),
        source: 'xunfei-cloud-function'
      };
    }

    if (audioData.length > 10000000) { // 约10MB
      return {
        success: false,
        error: '音频数据太大，请录制较短的音频',
        timestamp: new Date().toISOString(),
        source: 'xunfei-cloud-function'
      };
    }

    // 根据上传类型选择合适的科大讯飞API
    let result;
    if (uploadType === 'file' && audioData.length > 100000) {
      // 使用文件语音识别API (LFASR) - 适合较大的文件
      console.log('📂 使用科大讯飞文件语音识别API (LFASR)');
      result = await callXunfeiLFASR(audioData, audioFormat, fileName, config);
    } else {
      // 使用实时语音识别API (IAT) - 适合短音频和录音
      console.log('🎤 使用科大讯飞实时语音识别API (IAT)');
      result = await callXunfeiASR(audioData, config);
    }

    console.log('✅ 语音识别成功:', result.text);
    
    return {
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence || 0.95,
        timestamp: new Date().toISOString(),
        source: 'xunfei-cloud-function'
      }
    };

  } catch (error) {
    console.error('❌ 语音识别失败:', error);
    
    return {
      success: false,
      error: error.message || '语音识别失败',
      timestamp: new Date().toISOString(),
      source: 'xunfei-cloud-function'
    };
  }
};

async function callXunfeiASR(audioData, config) {
  const appId = config.appId;
  const apiSecret = config.apiSecret;
  const apiKey = config.apiKey;
  
  // 构建请求URL和参数
  const host = 'iat-api.xfyun.cn';
  const path = '/v2/iat';
  const method = 'POST';
  
  // 生成RFC1123格式时间戳
  const date = new Date().toUTCString();
  
  // 构建签名字符串
  const signatureOrigin = 'host: ' + host + '\ndate: ' + date + '\n' + method + ' ' + path + ' HTTP/1.1';
  
  // 使用HMAC-SHA256生成签名
  const signature = crypto.createHmac('sha256', apiSecret).update(signatureOrigin).digest('base64');
  
  // 构建Authorization header
  const authorization = 'api_key="' + apiKey + '", algorithm="hmac-sha256", headers="host date request-line", signature="' + signature + '"';
  
  // 确保audioData是base64格式
  let audioBase64;
  if (typeof audioData === 'string') {
    audioBase64 = audioData;
  } else if (Buffer.isBuffer(audioData)) {
    audioBase64 = audioData.toString('base64');
  } else {
    audioBase64 = Buffer.from(audioData).toString('base64');
  }
  
  // 构建请求体
  const requestBody = {
    common: {
      app_id: appId
    },
    business: {
      language: 'zh_cn',
      domain: 'iat',
      accent: 'mandarin',
      vinfo: 1,
      vad_eos: 5000,
      dwa: 'wpgs',
      ptt: 0,
      nunum: 0,
      speex_size: 60
    },
    data: {
      status: 2,
      format: 'audio/L16;rate=16000',
      encoding: 'raw',
      audio: audioBase64
    }
  };

  console.log('🌐 发送科大讯飞API请求:', {
    host: host,
    path: path,
    audioSize: audioBase64.length,
    appId: appId.substring(0, 8) + '...'
  });

  // 使用Node.js内置的https模块而不是fetch
  const https = require('https');
  const requestData = JSON.stringify(requestBody);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Host': host,
        'Date': date,
        'Authorization': authorization,
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('🔍 科大讯飞API响应:', JSON.stringify(result, null, 2));
          
          if (result.code !== 0) {
            console.error('科大讯飞识别错误:', result);
            console.error('错误详情:', {
              code: result.code,
              message: result.message,
              sid: result.sid,
              data: result.data
            });
            
            // 根据错误码提供更具体的错误信息
            let errorMessage = result.message || '未知错误';
            if (result.code === 10105) {
              errorMessage = '音频格式不支持，请检查音频编码格式';
            } else if (result.code === 10106) {
              errorMessage = '音频采样率不支持，需要16kHz采样率';
            } else if (result.code === 10107) {
              errorMessage = '音频时长不合法，建议录音5-60秒';
            } else if (result.code === 10109) {
              errorMessage = '音频内容无效或为空';
            }
            
            reject(new Error('语音识别失败: ' + errorMessage));
            return;
          }

          // 解析识别结果
          let recognizedText = '';
          let confidence = 0;
          
          if (result.data && result.data.result) {
            const wsResults = result.data.result.ws || [];
            
            for (let i = 0; i < wsResults.length; i++) {
              const ws = wsResults[i];
              if (ws.cw && ws.cw.length > 0) {
                // 取置信度最高的词
                let bestWord = ws.cw[0];
                for (let j = 1; j < ws.cw.length; j++) {
                  if (ws.cw[j].sc > bestWord.sc) {
                    bestWord = ws.cw[j];
                  }
                }
                
                recognizedText += bestWord.w;
                if (bestWord.sc > confidence) {
                  confidence = bestWord.sc;
                }
              }
            }
          }

          if (!recognizedText) {
            reject(new Error('未识别到语音内容，请重新录制'));
            return;
          }

          console.log('✅ 识别结果:', { text: recognizedText, confidence: confidence });

          resolve({
            text: recognizedText,
            confidence: confidence
          });
          
        } catch (parseError) {
          console.error('解析响应失败:', parseError);
          reject(new Error('API响应解析失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('请求失败:', error);
      reject(new Error('API请求失败: ' + error.message));
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * 科大讯飞文件语音识别API (LFASR) - 适合长音频文件
 */
async function callXunfeiLFASR(audioData, audioFormat, fileName, config) {
  const appId = config.appId;
  const apiSecret = config.apiSecret;
  const apiKey = config.apiKey;
  
  // LFASR API配置
  const host = 'raasr.xfyun.cn';
  const uploadPath = '/v2/api/upload';
  const getResultPath = '/v2/api/getResult';
  
  try {
    console.log('📤 第一步：上传音频文件到科大讯飞LFASR');
    
    // 第一步：上传文件
    const uploadResult = await uploadAudioToLFASR(audioData, audioFormat, fileName, host, uploadPath, config);
    const orderId = uploadResult.orderId;
    
    console.log('📋 获得订单ID:', orderId);
    console.log('⏳ 第二步：等待处理并获取识别结果');
    
    // 第二步：轮询获取结果
    const maxRetries = 30; // 最多轮询30次
    const retryInterval = 2000; // 每2秒查询一次
    
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      
      try {
        const result = await getResultFromLFASR(orderId, host, getResultPath, config);
        
        if (result.status === 4) {
          // 处理完成
          console.log('✅ LFASR识别完成');
          return {
            text: result.result,
            confidence: 0.95,
            orderId: orderId
          };
        } else if (result.status === 5) {
          // 处理失败
          throw new Error('LFASR处理失败: ' + (result.description || '未知错误'));
        }
        
        console.log(`🔄 第${i + 1}次查询，状态: ${result.status}, 描述: ${result.description}`);
      } catch (error) {
        console.log(`⚠️ 第${i + 1}次查询出错:`, error.message);
      }
    }
    
    throw new Error('LFASR处理超时，请稍后重试');
    
  } catch (error) {
    console.error('❌ LFASR调用失败:', error);
    throw error;
  }
}

/**
 * 上传音频文件到LFASR
 */
async function uploadAudioToLFASR(audioData, audioFormat, fileName, host, path, config) {
  const https = require('https');
  const FormData = require('form-data');
  
  return new Promise((resolve, reject) => {
    try {
      // 生成签名
      const ts = Math.floor(Date.now() / 1000);
      const md5 = crypto.createHash('md5');
      const signa = md5.update(config.apiKey + ts).digest('hex');
      
      // 创建FormData
      const form = new FormData();
      form.append('appId', config.appId);
      form.append('signa', signa);
      form.append('ts', ts.toString());
      form.append('fileSize', Buffer.byteLength(audioData, 'base64'));
      form.append('fileName', fileName);
      form.append('duration', '0');
      
      // 将base64转换为Buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      form.append('file', audioBuffer, {
        filename: fileName,
        contentType: getContentType(audioFormat)
      });
      
      const options = {
        hostname: host,
        path: path,
        method: 'POST',
        headers: form.getHeaders()
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('📤 LFASR上传响应:', result);
            
            if (result.code !== '000000') {
              reject(new Error('LFASR上传失败: ' + (result.descInfo || '未知错误')));
              return;
            }
            
            resolve({
              orderId: result.content.orderId
            });
          } catch (parseError) {
            reject(new Error('LFASR上传响应解析失败'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error('LFASR上传请求失败: ' + error.message));
      });
      
      form.pipe(req);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 从LFASR获取识别结果
 */
async function getResultFromLFASR(orderId, host, path, config) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    try {
      // 生成签名
      const ts = Math.floor(Date.now() / 1000);
      const md5 = crypto.createHash('md5');
      const signa = md5.update(config.apiKey + ts).digest('hex');
      
      const postData = JSON.stringify({
        appId: config.appId,
        signa: signa,
        ts: ts,
        orderId: orderId
      });
      
      const options = {
        hostname: host,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.code !== '000000') {
              reject(new Error('LFASR查询失败: ' + (result.descInfo || '未知错误')));
              return;
            }
            
            const content = result.content;
            let resultText = '';
            
            if (content.orderResult) {
              // 解析识别结果
              const orderResult = JSON.parse(content.orderResult);
              if (orderResult.lattice) {
                orderResult.lattice.forEach(item => {
                  if (item.json_1best) {
                    const json1best = JSON.parse(item.json_1best);
                    if (json1best.st && json1best.st.rt) {
                      json1best.st.rt.forEach(rt => {
                        if (rt.ws) {
                          rt.ws.forEach(ws => {
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
            
            resolve({
              status: content.orderInfo.status,
              description: content.orderInfo.desc,
              result: resultText
            });
            
          } catch (parseError) {
            reject(new Error('LFASR结果解析失败'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error('LFASR查询请求失败: ' + error.message));
      });
      
      req.write(postData);
      req.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 根据音频格式获取Content-Type
 */
function getContentType(audioFormat) {
  const contentTypes = {
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg',
    'mpeg': 'audio/mpeg',
    'webm': 'audio/webm',
    'ogg': 'audio/ogg'
  };
  
  return contentTypes[audioFormat] || 'audio/wav';
}