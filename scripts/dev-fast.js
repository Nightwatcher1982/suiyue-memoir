#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 启动快速开发服务器...');

// 清理缓存
function cleanCache() {
  console.log('🧹 清理缓存...');
  const cacheDirs = [
    '.next',
    'node_modules/.cache',
    '.turbo'
  ];
  
  cacheDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ 已清理 ${dir}`);
    }
  });
}

// 检查环境变量
function checkEnv() {
  console.log('🔍 检查环境配置...');
  const envFile = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envFile)) {
    console.log('⚠️  未找到 .env.local 文件，将使用默认配置');
  } else {
    console.log('✅ 环境配置文件存在');
  }
}

// 启动开发服务器
function startDev() {
  console.log('⚡ 启动开发服务器...');
  
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    NEXT_TELEMETRY_DISABLED: '1', // 禁用遥测以提升性能
  };

  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env,
    shell: true
  });

  child.on('error', (error) => {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    console.log(`\n🔄 开发服务器已退出，退出码: ${code}`);
    process.exit(code);
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    child.kill('SIGTERM');
  });
}

// 主函数
async function main() {
  try {
    // 只在首次启动时清理缓存
    if (process.argv.includes('--clean')) {
      cleanCache();
    }
    
    checkEnv();
    startDev();
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

main(); 