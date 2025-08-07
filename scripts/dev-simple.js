#!/usr/bin/env node

/**
 * 简化的开发服务器启动脚本
 * 解决循环启动问题，提供稳定的开发环境
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 岁阅项目 - 简化开发服务器');

// 检查环境配置
function checkEnvironment() {
  console.log('📋 检查环境配置...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  未找到 .env.local 文件');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // 检查关键配置
  const hasCloudBase = envContent.includes('NEXT_PUBLIC_CLOUDBASE_ENV_ID=suiyue-memoir-dev');
  const hasAPI = envContent.includes('DASHSCOPE_API_KEY=sk-');
  
  if (hasCloudBase) {
    console.log('✅ CloudBase 环境配置正常');
  } else {
    console.log('⚠️  CloudBase 环境配置缺失');
  }
  
  if (hasAPI) {
    console.log('✅ AI API 密钥配置正常');
  } else {
    console.log('⚠️  AI API 密钥未配置，将使用模拟响应');
  }
  
  return true;
}

// 启动Next.js开发服务器
function startNextJS() {
  console.log('⚡ 启动 Next.js 开发服务器...');
  
  const nextProcess = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    shell: true,
  });

  nextProcess.on('error', (error) => {
    console.error('❌ Next.js 启动失败:', error.message);
    process.exit(1);
  });

  nextProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.log('⚠️  Next.js 服务器退出，代码:', code);
    }
    process.exit(code);
  });

  return nextProcess;
}

// 启动WebSocket代理（可选）
function startWebSocketProxy() {
  console.log('🔌 启动 WebSocket 代理服务器...');
  
  const proxyProcess = spawn('node', ['websocket-proxy-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
    shell: true,
  });

  proxyProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('WebSocket代理服务器启动') || output.includes('❌')) {
      process.stdout.write(`[WebSocket] ${output}`);
    }
  });

  proxyProcess.stderr.on('data', (data) => {
    process.stderr.write(`[WebSocket] ${data}`);
  });

  proxyProcess.on('error', (error) => {
    console.log('⚠️  WebSocket 代理启动失败:', error.message);
    console.log('📝 语音功能可能不可用，但主应用可以正常运行');
  });

  proxyProcess.on('exit', (code) => {
    if (code !== 0) {
      console.log('⚠️  WebSocket 代理退出，代码:', code);
    }
  });

  return proxyProcess;
}

// 优雅关闭
function gracefulShutdown() {
  console.log('\n🛑 正在关闭开发服务器...');
  process.exit(0);
}

// 主函数
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('🎯 岁阅项目开发环境');
    console.log('='.repeat(50));
    
    // 检查环境
    const envOk = checkEnvironment();
    if (!envOk) {
      console.log('💡 请运行 npm run env:init 初始化环境配置');
      process.exit(1);
    }
    
    // 启动服务
    console.log('\n🚀 启动开发服务...');
    
    const nextProcess = startNextJS();
    
    // 延迟启动WebSocket代理，避免端口冲突
    setTimeout(() => {
      try {
        startWebSocketProxy();
      } catch (error) {
        console.log('⚠️  WebSocket 代理启动失败，但主应用可以正常使用');
      }
    }, 3000);
    
    console.log('\n📝 开发服务器信息:');
    console.log('   🌐 主应用: http://localhost:3000');
    console.log('   🔌 WebSocket代理: ws://localhost:8080/ws-proxy');
    console.log('   ⌨️  按 Ctrl+C 退出\n');
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 信号处理
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// 启动
if (require.main === module) {
  main().catch(console.error);
}