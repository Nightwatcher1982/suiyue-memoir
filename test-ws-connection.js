const WebSocket = require('ws');

console.log('🧪 开始测试WebSocket代理连接...');

const ws = new WebSocket('ws://localhost:8080/ws-proxy');

ws.on('open', function open() {
  console.log('✅ WebSocket连接已建立');
  
  // 等待代理连接消息
  setTimeout(() => {
    console.log('📤 发送测试消息...');
    ws.send(JSON.stringify({
      type: 'test',
      message: 'Hello from test client'
    }));
  }, 2000);
  
  // 5秒后关闭连接
  setTimeout(() => {
    console.log('🔌 关闭测试连接');
    ws.close();
  }, 5000);
});

ws.on('message', function message(data) {
  try {
    const msg = JSON.parse(data.toString());
    console.log('📡 收到消息:', msg);
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