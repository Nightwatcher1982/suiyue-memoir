const WebSocket = require('ws');

console.log('🧪 测试音频数据流传输...');

const ws = new WebSocket('ws://localhost:8080/ws-proxy');

let taskStarted = false;

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
      
      ws.send(JSON.stringify(initMessage));
      console.log('✅ 初始化消息已发送');
      
    } else if (msg.header && msg.header.event === 'task-started') {
      console.log('🎯 DashScope任务已启动，开始发送模拟音频数据...');
      taskStarted = true;
      
      // 发送一些模拟音频数据
      let audioCount = 0;
      const sendAudio = () => {
        if (audioCount < 3 && taskStarted) {
          const fakeAudioData = Buffer.alloc(1024); // 1KB 假音频数据
          ws.send(fakeAudioData);
          console.log(`🎵 发送音频数据 ${audioCount + 1}: ${fakeAudioData.length} bytes`);
          audioCount++;
          setTimeout(sendAudio, 1000); // 每秒发送一次
        } else {
          console.log('🛑 音频数据发送完毕，发送结束消息...');
          
          // 发送结束消息
          const endMessage = {
            header: {
              action: 'finish-task'
            },
            payload: {
              input: {
                audio_encoding: 'pcm',
                sample_rate: 16000,
                format: 'pcm'
              }
            }
          };
          
          ws.send(JSON.stringify(endMessage));
          console.log('✅ 结束消息已发送');
          
          // 等待一会儿然后关闭
          setTimeout(() => {
            console.log('🔌 关闭连接');
            ws.close();
          }, 3000);
        }
      };
      
      sendAudio();
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