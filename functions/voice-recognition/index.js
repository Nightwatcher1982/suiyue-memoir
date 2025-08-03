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
    // 从环境变量获取API凭证，如果没有则使用用户提供的AppId
    const config = {
      appId: process.env.XUNFEI_APP_ID || '6b59d550',
      apiSecret: process.env.XUNFEI_API_SECRET,
      apiKey: process.env.XUNFEI_API_KEY
    };
    
    console.log('🔍 环境变量检查:');
    console.log('XUNFEI_APP_ID:', process.env.XUNFEI_APP_ID ? '已设置' : '未设置');
    console.log('XUNFEI_API_SECRET:', process.env.XUNFEI_API_SECRET ? '已设置' : '未设置');
    console.log('XUNFEI_API_KEY:', process.env.XUNFEI_API_KEY ? '已设置' : '未设置');
    
    // 输出配置详细信息用于调试
    console.log('🔧 配置详细信息:');
    console.log('appId:', config.appId);
    console.log('apiSecret长度:', config.apiSecret ? config.apiSecret.length : 0);
    console.log('apiKey长度:', config.apiKey ? config.apiKey.length : 0);
    console.log('apiSecret前4位:', config.apiSecret ? config.apiSecret.substring(0, 4) + '...' : '未设置');
    console.log('apiKey前4位:', config.apiKey ? config.apiKey.substring(0, 4) + '...' : '未设置');
    
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
        source: 'xunfei-cloud-function',
        debug: {
          hasAppId: !!config.appId,
          hasApiSecret: !!config.apiSecret,
          hasApiKey: !!config.apiKey,
          appId: config.appId,
          secretLength: config.apiSecret ? config.apiSecret.length : 0,
          keyLength: config.apiKey ? config.apiKey.length : 0
        }
      };
    }

    // 添加API凭证测试 - 如果是测试模式，跳过音频处理
    if (event.testMode) {
      console.log('🧪 测试模式：验证API凭证');
      const testResult = await testXunfeiCredentials(config);
      return testResult;
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
  console.log('🌐 使用科大讯飞语音转写HTTP API');
  
  const appId = config.appId;
  const apiKey = config.apiKey;
  
  // 确保audioData是base64格式
  let audioBase64;
  if (typeof audioData === 'string') {
    audioBase64 = audioData;
  } else if (Buffer.isBuffer(audioData)) {
    audioBase64 = audioData.toString('base64');
  } else {
    audioBase64 = Buffer.from(audioData).toString('base64');
  }
  
  // 使用语音转写HTTP API
  const host = 'raasr.xfyun.cn';
  const uploadPath = '/v2/api/upload';
  const getResultPath = '/v2/api/getResult';
  
  try {
    console.log('📤 第一步：上传音频文件到科大讯飞');
    console.log('🔧 调试信息: audioBase64长度:', audioBase64.length);
    console.log('🔧 调试信息: config:', JSON.stringify(config, null, 2));
    
    // 第一步：上传文件
    const uploadResult = await uploadAudioToXunfei(audioBase64, 'wav', `audio-${Date.now()}.wav`, config);
    const orderId = uploadResult.orderId;
    
    console.log('📋 获得订单ID:', orderId);
    console.log('⏳ 第二步：等待处理并获取识别结果');
    
    // 第二步：轮询获取结果
    const maxRetries = 30; // 最多轮询30次
    const retryInterval = 2000; // 每2秒查询一次
    
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, retryInterval));
      
      try {
        const result = await getResultFromXunfei(orderId, config);
        
        if (result.status === 4) {
          // 处理完成
          console.log('✅ 语音转写识别完成');
          return {
            text: result.result,
            confidence: 0.95,
            orderId: orderId
          };
        } else if (result.status === 5) {
          // 处理失败
          throw new Error('语音转写处理失败: ' + (result.description || '未知错误'));
        }
        
        console.log(`🔄 第${i + 1}次查询，状态: ${result.status}, 描述: ${result.description}`);
      } catch (error) {
        console.log(`⚠️ 第${i + 1}次查询出错:`, error.message);
      }
    }
    
    throw new Error('语音转写处理超时，请稍后重试');
    
  } catch (error) {
    console.error('❌ 语音转写调用失败:', error);
    throw error;
  }
}

async function uploadAudioToXunfei(audioBase64, audioFormat, fileName, config) {
  const https = require('https');
  const querystring = require('querystring');
  
  return new Promise((resolve, reject) => {
    try {
      // 生成签名 - 科大讯飞语音转写API的正确签名算法
      const ts = Math.floor(Date.now() / 1000);
      
      // 第一步：生成baseString（appId + ts）
      const baseString = config.appId + ts.toString();
      
      // 第二步：对baseString进行MD5
      const md5Hash = crypto.createHash('md5').update(baseString).digest('hex');
      
      // 第三步：使用secretKey对MD5结果进行HmacSHA1加密，然后base64编码
      const hmacSha1 = crypto.createHmac('sha1', config.apiSecret);
      const signa = hmacSha1.update(md5Hash).digest('base64');
      
      console.log('🔐 上传签名生成调试:');
      console.log('appId:', config.appId);
      console.log('时间戳:', ts);
      console.log('baseString:', baseString);
      console.log('MD5结果:', md5Hash);
      console.log('最终签名:', signa);
      
      // 将base64转换为Buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      const formData = {
        appId: config.appId,
        signa: signa,
        ts: ts.toString(),
        fileSize: audioBuffer.length.toString(),
        fileName: fileName,
        duration: '0'
      };
      
      const boundary = '----formdata-' + Math.random().toString(36);
      let body = '';
      
      // 构建multipart/form-data
      Object.keys(formData).forEach(key => {
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        body += `${formData[key]}\r\n`;
      });
      
      // 添加文件数据
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
      body += `Content-Type: audio/wav\r\n\r\n`;
      
      const bodyBuffer = Buffer.concat([
        Buffer.from(body, 'utf8'),
        audioBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
      ]);
      
      const options = {
        hostname: 'raasr.xfyun.cn',
        path: '/v2/api/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            console.log('📤 语音转写上传HTTP状态码:', res.statusCode);
            console.log('📤 语音转写上传响应原始数据:', data);
            const result = JSON.parse(data);
            console.log('📤 语音转写上传响应:', result);
            
            if (result.code !== '000000') {
              reject(new Error('语音转写上传失败: ' + (result.descInfo || '未知错误')));
              return;
            }
            
            resolve({
              orderId: result.content.orderId
            });
          } catch (parseError) {
            reject(new Error('语音转写上传响应解析失败'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error('语音转写上传请求失败: ' + error.message));
      });
      
      req.write(bodyBuffer);
      req.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

async function getResultFromXunfei(orderId, config) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    try {
      // 生成签名 - 科大讯飞语音转写API的正确签名算法
      const ts = Math.floor(Date.now() / 1000);
      
      // 第一步：生成baseString（appId + ts）
      const baseString = config.appId + ts.toString();
      
      // 第二步：对baseString进行MD5
      const md5Hash = crypto.createHash('md5').update(baseString).digest('hex');
      
      // 第三步：使用secretKey对MD5结果进行HmacSHA1加密，然后base64编码
      const hmacSha1 = crypto.createHmac('sha1', config.apiSecret);
      const signa = hmacSha1.update(md5Hash).digest('base64');
      
      console.log('🔐 查询签名生成调试:');
      console.log('appId:', config.appId);
      console.log('时间戳:', ts);
      console.log('baseString:', baseString);
      console.log('MD5结果:', md5Hash);
      console.log('最终签名:', signa);
      
      const postData = JSON.stringify({
        appId: config.appId,
        signa: signa,
        ts: ts,
        orderId: orderId
      });
      
      const options = {
        hostname: 'raasr.xfyun.cn',
        path: '/v2/api/getResult',
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
              reject(new Error('语音转写查询失败: ' + (result.descInfo || '未知错误')));
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
            reject(new Error('语音转写结果解析失败'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error('语音转写查询请求失败: ' + error.message));
      });
      
      req.write(postData);
      req.end();
      
    } catch (error) {
      reject(error);
    }
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
 * 测试科大讯飞API凭证是否有效
 */
async function testXunfeiCredentials(config) {
  try {
    console.log('🧪 开始API凭证测试');
    
    // 使用最小化的测试数据
    const testAudioBase64 = 'UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAAAA'; // 最小的WAV文件
    
    // 测试语音转写API
    const uploadResult = await uploadAudioToXunfei(testAudioBase64, 'wav', 'test.wav', config);
    
    return {
      success: true,
      message: 'API凭证测试成功',
      orderId: uploadResult.orderId,
      timestamp: new Date().toISOString(),
      source: 'xunfei-credential-test'
    };
    
  } catch (error) {
    console.error('🧪 API凭证测试失败:', error);
    return {
      success: false,
      error: 'API凭证测试失败: ' + error.message,
      timestamp: new Date().toISOString(),
      source: 'xunfei-credential-test'
    };
  }
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