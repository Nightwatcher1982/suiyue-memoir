const WebSocket = require('ws');

console.log('🧪 开始测试WebSocket代理连接（正确格式）...');

const ws = new WebSocket('ws://localhost:8080/ws-proxy');

ws.on('open', function open() {
  console.log('✅ WebSocket连接已建立');
});

ws.on('message', function message(data) {
  try {
    const msg = JSON.parse(data.toString());
    console.log('📡 收到消息:', JSON.stringify(msg, null, 2));
    
    if (msg.type === 'proxy-connected') {
      console.log('🎯 DashScope连接成功，发送正确的初始化消息...');
      
      // 发送DashScope标准初始化消息
      const initMessage = {
        header: {
          action: 'run-task',
          streaming: 'duplex',
          task_id: `voice-${Date.now()}-${Math.random().toString(36).substring(7)}`
        },
        payload: {
          model: 'paraformer-realtime-v2',
          task_group: 'audio',
          task: 'asr',
          function: 'recognition',
          input: {
            audio_encoding: 'pcm',
            sample_rate: 16000,
            format: 'pcm'
          },
          parameters: {
            language_hints: ['zh']
          }
        }
      };
      
      ws.send(JSON.stringify(initMessage));
      console.log('📤 初始化消息已发送');
      
      // 5秒后关闭连接
      setTimeout(() => {
        console.log('🔌 关闭测试连接');
        ws.close();
      }, 5000);
    }
  } catch (err) {
    console.log('📡 收到原始消息:', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket错误:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log('🔌 WebSocket连接关闭:', code, reason.toString());
  process.exit(0);
});