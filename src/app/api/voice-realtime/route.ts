import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

// DashScope WebSocket实时语音识别配置
const DASHSCOPE_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference';
const DASHSCOPE_API_KEY = API_CONFIG.DASHSCOPE.API_KEY;

export async function GET(request: NextRequest) {
  // 生成WebSocket认证URL
  const authUrl = generateAuthenticatedWebSocketUrl();
  
  return NextResponse.json({
    message: 'DashScope WebSocket实时语音识别API',
    websocketUrl: authUrl,
    proxyUrl: 'ws://localhost:8080/ws-proxy', // WebSocket代理地址
    usage: 'Use WebSocket proxy for real-time speech recognition',
    model: 'paraformer-realtime-v2',
    config: {
      apiKey: DASHSCOPE_API_KEY ? '已配置' : '未配置',
      proxyStatus: '运行在端口8080'
    }
  });
}

// 生成带认证的WebSocket URL
function generateAuthenticatedWebSocketUrl(): string {
  if (!DASHSCOPE_API_KEY) {
    return DASHSCOPE_WS_URL;
  }
  
  // DashScope WebSocket认证通过Header传递，不是URL参数
  // 前端需要在连接时传递Authorization header
  return DASHSCOPE_WS_URL;
}

// 实时语音识别不使用HTTP POST，而是直接通过WebSocket连接
// 前端应该直接连接到DashScope的WebSocket端点
export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: '实时语音识别请使用WebSocket连接',
    websocketUrl: DASHSCOPE_WS_URL,
    instructions: '请在前端直接建立WebSocket连接进行实时语音识别'
  }, { status: 400 });
}