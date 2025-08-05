const WebSocket = require('ws');

console.log('🧪 开始调试DashScope WebSocket连接...');

const ws = new WebSocket('ws://localhost:8080/ws-proxy');

ws.on('open', function open() {
  console.log('✅ WebSocket连接已建立');
});

ws.on('message', function message(data) {
  try {
    const msg = JSON.parse(data.toString());
    console.log('📡 收到消息:', JSON.stringify(msg, null, 2));
    
    if (msg.type === 'proxy-connected') {
      console.log('🎯 DashScope连接成功，发送初始化消息...');
      
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
      
      console.log('📤 发送的初始化消息:');
      console.log(JSON.stringify(initMessage, null, 2));
      
      ws.send(JSON.stringify(initMessage));
      console.log('✅ 初始化消息已发送，等待DashScope响应...');
      
      // 等待10秒看是否有响应
      setTimeout(() => {
        console.log('⏰ 10秒等待期结束，关闭连接');
        ws.close();
      }, 10000);
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