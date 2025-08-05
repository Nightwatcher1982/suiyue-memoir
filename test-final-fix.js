const WebSocket = require('ws');

console.log('🧪 测试最终修复的finish-task消息...');

const ws = new WebSocket('ws://localhost:8080/ws-proxy');
let taskId = '';

ws.on('open', function open() {
  console.log('✅ WebSocket连接已建立');
});

ws.on('message', function message(data) {
  try {
    const msg = JSON.parse(data.toString());
    console.log('📡 收到消息:', JSON.stringify(msg, null, 2));
    
    if (msg.type === 'proxy-connected') {
      console.log('🎯 DashScope连接成功，发送初始化消息...');
      
      taskId = `voice-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const initMessage = {
        header: {
          action: 'run-task',
          streaming: 'duplex',
          task_id: taskId
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
      console.log('✅ 初始化消息已发送，taskId:', taskId);
      
    } else if (msg.header && msg.header.event === 'task-started') {
      console.log('🎯 DashScope任务已启动，发送音频数据...');
      
      // 发送一次模拟音频数据
      const fakeAudioData = Buffer.alloc(512);
      ws.send(fakeAudioData);
      console.log('🎵 发送音频数据:', fakeAudioData.length, 'bytes');
      
      // 等待2秒后发送结束消息
      setTimeout(() => {
        console.log('🛑 发送结束消息...');
        
        const endMessage = {
          header: {
            action: 'finish-task',
            task_id: taskId
          },
          payload: {
            input: {
              audio_encoding: 'pcm',
              sample_rate: 16000,
              format: 'pcm'
            }
          }
        };
        
        console.log('📤 结束消息内容:', JSON.stringify(endMessage, null, 2));
        ws.send(JSON.stringify(endMessage));
        
      }, 2000);
      
    } else if (msg.header && msg.header.event === 'task-completed') {
      console.log('🎉 任务成功完成！');
      setTimeout(() => ws.close(), 1000);
      
    } else if (msg.header && msg.header.event === 'task-failed') {
      console.log('❌ 任务失败:', msg.header.error_message);
      setTimeout(() => ws.close(), 1000);
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