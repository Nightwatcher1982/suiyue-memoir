const WebSocket = require('ws');
const http = require('http');

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' });

const DASHSCOPE_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || process.env.TONGYI_ACCESS_KEY_ID;
const PROXY_PORT = 8080;

console.log('🚀 启动WebSocket代理服务器...');
console.log('📍 DashScope URL:', DASHSCOPE_WS_URL);
console.log('🔑 API Key:', DASHSCOPE_API_KEY ? '已配置' : '未配置');

// 创建HTTP服务器
const server = http.createServer();

// 创建WebSocket服务器
const wss = new WebSocket.Server({ 
  server,
  path: '/ws-proxy'
});

// 存储连接映射
const connections = new Map();

wss.on('connection', (clientWs, request) => {
  const clientId = Math.random().toString(36).substring(7);
  console.log(`👤 客户端 ${clientId} 连接到WebSocket代理`);
  
  let dashscopeWs = null;
  
  // 连接到DashScope WebSocket
  try {
    console.log(`🔗 为客户端 ${clientId} 连接到DashScope WebSocket`);
    console.log(`🔑 使用API Key: ${DASHSCOPE_API_KEY ? DASHSCOPE_API_KEY.substring(0, 10) + '...' : 'undefined'}`);
    
    dashscopeWs = new WebSocket(DASHSCOPE_WS_URL, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SuiYue-Memoir-WebSocket-Proxy/1.0'
      }
    });
    
    console.log(`✅ WebSocket对象已创建，等待连接...`);
    
    // 存储连接映射
    connections.set(clientId, { clientWs, dashscopeWs });
    
    // DashScope WebSocket连接成功
    dashscopeWs.on('open', () => {
      console.log(`✅ 客户端 ${clientId} 的DashScope WebSocket连接已建立`);
      
      // 通知客户端连接成功
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'proxy-connected',
          message: 'DashScope WebSocket代理连接成功',
          clientId
        }));
      }
    });
    
    // 转发DashScope消息到客户端
    dashscopeWs.on('message', (data) => {
      try {
        const message = data.toString();
        console.log(`📡 DashScope -> 客户端 ${clientId}:`, message);
        
        // 解析消息以便更好的调试
        try {
          const parsedMessage = JSON.parse(message);
          if (parsedMessage.header && parsedMessage.header.event) {
            console.log(`🎯 DashScope事件: ${parsedMessage.header.event}`);
          }
        } catch (parseErr) {
          // 不是JSON消息，忽略解析错误
        }
        
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(message);
        }
      } catch (err) {
        console.error(`❌ 转发DashScope消息到客户端 ${clientId} 失败:`, err);
      }
    });
    
    // 处理DashScope连接错误
    dashscopeWs.on('error', (error) => {
      console.error(`❌ 客户端 ${clientId} 的DashScope WebSocket错误:`, error);
      
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'proxy-error',
          error: error.message,
          clientId
        }));
      }
    });
    
    // 处理DashScope连接关闭
    dashscopeWs.on('close', (code, reason) => {
      console.log(`🔌 客户端 ${clientId} 的DashScope WebSocket关闭:`, code, reason.toString());
      
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'proxy-closed',
          code,
          reason: reason.toString(),
          clientId
        }));
      }
    });
    
  } catch (err) {
    console.error(`❌ 为客户端 ${clientId} 连接DashScope WebSocket失败:`, err);
    
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'proxy-error',
        error: err instanceof Error ? err.message : '连接DashScope失败',
        clientId
      }));
    }
  }
  
  // 转发客户端消息到DashScope
  clientWs.on('message', (data) => {
    try {
      if (dashscopeWs && dashscopeWs.readyState === WebSocket.OPEN) {
        // 检查数据类型
        console.log(`🔍 客户端 ${clientId} 数据类型检测:`, typeof data, 'Buffer?', data instanceof Buffer, '长度:', data.length);
        
        if (data instanceof Buffer) {
          // 尝试检测是否为文本数据
          const str = data.toString();
          try {
            const parsed = JSON.parse(str);
            // 是JSON文本数据
            console.log(`📤 客户端 ${clientId} -> DashScope (JSON消息):`);
            console.log(str);
            dashscopeWs.send(str);
          } catch (parseErr) {
            // 是二进制音频数据
            console.log(`🎵 客户端 ${clientId} -> DashScope: 音频数据 ${data.length} bytes`);
            dashscopeWs.send(data);
          }
        } else {
          // 文本数据（JSON消息）- 转换为字符串后转发
          const message = data.toString();
          console.log(`📤 客户端 ${clientId} -> DashScope (文本消息):`);
          console.log(message);
          dashscopeWs.send(message);
        }
      } else {
        console.error(`❌ 客户端 ${clientId} 的DashScope WebSocket未连接，无法转发消息`);
        
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'proxy-error',
            error: 'DashScope WebSocket未连接',
            clientId
          }));
        }
      }
    } catch (err) {
      console.error(`❌ 转发客户端 ${clientId} 消息失败:`, err);
    }
  });
  
  // 处理客户端断开连接
  clientWs.on('close', () => {
    console.log(`👋 客户端 ${clientId} 断开连接`);
    
    if (dashscopeWs) {
      dashscopeWs.close();
    }
    
    connections.delete(clientId);
  });
  
  // 处理客户端错误
  clientWs.on('error', (error) => {
    console.error(`❌ 客户端 ${clientId} WebSocket错误:`, error);
    
    if (dashscopeWs) {
      dashscopeWs.close();
    }
    
    connections.delete(clientId);
  });
});

// 启动服务器
server.listen(PROXY_PORT, () => {
  console.log(`✅ WebSocket代理服务器启动在端口 ${PROXY_PORT}`);
  console.log(`🌐 代理地址: ws://localhost:${PROXY_PORT}/ws-proxy`);
  console.log('📋 状态: 等待客户端连接...');
});

// 处理服务器错误
server.on('error', (error) => {
  console.error('❌ 服务器错误:', error);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭WebSocket代理服务器...');
  
  // 关闭所有连接
  connections.forEach(({ clientWs, dashscopeWs }, clientId) => {
    console.log(`🔌 关闭客户端 ${clientId} 的连接`);
    if (clientWs) clientWs.close();
    if (dashscopeWs) dashscopeWs.close();
  });
  
  wss.close(() => {
    console.log('✅ WebSocket代理服务器已关闭');
    process.exit(0);
  });
});

// 定期清理无效连接
setInterval(() => {
  const activeConnections = [];
  connections.forEach(({ clientWs, dashscopeWs }, clientId) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      activeConnections.push(clientId);
    } else {
      console.log(`🧹 清理无效连接: ${clientId}`);
      if (dashscopeWs) dashscopeWs.close();
      connections.delete(clientId);
    }
  });
  
  if (activeConnections.length > 0) {
    console.log(`💡 当前活跃连接: ${activeConnections.length} 个`);
  }
}, 30000); // 每30秒清理一次