#!/usr/bin/env node

/**
 * 岁阅项目统一开发服务器管理工具
 * 解决启动服务时的各种问题，确保稳定运行
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// 配置
const CONFIG = {
  DEV_PORT: 3000,
  WS_PROXY_PORT: 8080,
  HEALTH_CHECK_TIMEOUT: 30000, // 30秒健康检查超时
  RESTART_DELAY: 2000, // 重启延迟
  MAX_RETRIES: 3, // 最大重试次数
};

let processes = {
  nextjs: null,
  wsProxy: null,
};

let retryCount = 0;

console.log('🚀 岁阅开发服务器管理工具启动');
console.log('🔧 配置信息:');
console.log(`   Next.js 端口: ${CONFIG.DEV_PORT}`);
console.log(`   WebSocket 代理端口: ${CONFIG.WS_PROXY_PORT}`);

// 工具函数
function log(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = { info: '📝', error: '❌', success: '✅', warn: '⚠️' }[level] || 'ℹ️';
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, (err) => {
      if (err) {
        resolve(false);
      } else {
        server.once('close', () => resolve(true));
        server.close();
      }
    });
    server.on('error', () => resolve(false));
  });
}

// 杀死占用端口的进程
function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve();
        return;
      }
      
      const pids = stdout.trim().split('\n');
      let killCount = 0;
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (killErr) => {
          killCount++;
          if (killCount === pids.length) {
            log('info', `已终止占用端口 ${port} 的进程`);
            setTimeout(resolve, 1000); // 等待1秒确保端口释放
          }
        });
      });
    });
  });
}

// 检查环境变量
function checkEnvironment() {
  log('info', '检查环境配置...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('warn', '未找到 .env.local 文件，某些功能可能无法正常工作');
    return false;
  }

  // 读取环境变量并检查关键配置
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_CLOUDBASE_ENV_ID',
    'DASHSCOPE_API_KEY',
  ];

  const missingVars = requiredVars.filter(varName => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    if (!match || !match[1] || match[1].trim() === '' || match[1].includes('your-')) {
      return true; // 变量缺失或未正确配置
    }
    return false; // 变量配置正确
  });

  if (missingVars.length > 0) {
    log('warn', `以下环境变量未正确配置: ${missingVars.join(', ')}`);
    log('warn', '部分功能将使用模拟响应');
  } else {
    log('success', '环境配置检查通过');
  }

  return true;
}

// 清理缓存
function cleanCache(force = false) {
  if (!force && !process.argv.includes('--clean')) {
    return;
  }

  log('info', '清理项目缓存...');
  const cacheDirs = ['.next', 'node_modules/.cache', '.turbo'];
  
  cacheDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        log('success', `已清理 ${dir}`);
      } catch (err) {
        log('warn', `清理 ${dir} 失败: ${err.message}`);
      }
    }
  });
}

// 启动Next.js开发服务器
function startNextJS() {
  return new Promise((resolve, reject) => {
    log('info', '启动 Next.js 开发服务器...');

    const env = {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: CONFIG.DEV_PORT.toString(),
    };

    processes.nextjs = spawn('npx', ['next', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      shell: false,
      cwd: process.cwd(),
    });

    let startupComplete = false;

    processes.nextjs.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);

      // 检查是否启动成功
      if (output.includes('Ready') || output.includes(`localhost:${CONFIG.DEV_PORT}`)) {
        if (!startupComplete) {
          startupComplete = true;
          log('success', `Next.js 开发服务器已启动 (端口 ${CONFIG.DEV_PORT})`);
          resolve();
        }
      }
    });

    processes.nextjs.stderr.on('data', (data) => {
      const error = data.toString();
      process.stderr.write(error);

      // 检查是否为致命错误
      if (error.includes('EADDRINUSE') || error.includes('Port') && error.includes('already')) {
        if (!startupComplete) {
          reject(new Error(`端口 ${CONFIG.DEV_PORT} 已被占用`));
        }
      }
    });

    processes.nextjs.on('error', (error) => {
      log('error', `Next.js 服务器启动失败: ${error.message}`);
      if (!startupComplete) {
        reject(error);
      }
    });

    processes.nextjs.on('exit', (code, signal) => {
      log('warn', `Next.js 服务器退出 (代码: ${code}, 信号: ${signal})`);
      processes.nextjs = null;
      
      if (!startupComplete && code !== 0) {
        reject(new Error(`Next.js 服务器异常退出`));
      }
    });

    // 启动超时检查
    setTimeout(() => {
      if (!startupComplete) {
        reject(new Error('Next.js 服务器启动超时'));
      }
    }, CONFIG.HEALTH_CHECK_TIMEOUT);
  });
}

// 启动WebSocket代理服务器
function startWebSocketProxy() {
  return new Promise((resolve, reject) => {
    log('info', '启动 WebSocket 代理服务器...');

    processes.wsProxy = spawn('node', ['websocket-proxy-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
      shell: false,
      cwd: process.cwd(),
    });

    let startupComplete = false;

    processes.wsProxy.stdout.on('data', (data) => {
      const output = data.toString();
      
      // 过滤详细的WebSocket调试信息，只显示重要信息
      if (output.includes('WebSocket代理服务器启动') || 
          output.includes('客户端') && output.includes('连接') ||
          output.includes('❌')) {
        process.stdout.write(`[WS-Proxy] ${output}`);
      }

      if (output.includes('WebSocket代理服务器启动在端口')) {
        if (!startupComplete) {
          startupComplete = true;
          log('success', `WebSocket 代理服务器已启动 (端口 ${CONFIG.WS_PROXY_PORT})`);
          resolve();
        }
      }
    });

    processes.wsProxy.stderr.on('data', (data) => {
      const error = data.toString();
      process.stderr.write(`[WS-Proxy] ${error}`);

      if (error.includes('EADDRINUSE')) {
        if (!startupComplete) {
          reject(new Error(`WebSocket代理端口 ${CONFIG.WS_PROXY_PORT} 已被占用`));
        }
      }
    });

    processes.wsProxy.on('error', (error) => {
      log('error', `WebSocket 代理启动失败: ${error.message}`);
      if (!startupComplete) {
        reject(error);
      }
    });

    processes.wsProxy.on('exit', (code, signal) => {
      log('warn', `WebSocket 代理服务器退出 (代码: ${code}, 信号: ${signal})`);
      processes.wsProxy = null;
    });

    // 启动超时检查
    setTimeout(() => {
      if (!startupComplete) {
        reject(new Error('WebSocket 代理服务器启动超时'));
      }
    }, 10000); // WebSocket代理启动较快，10秒超时
  });
}

// 健康检查
function healthCheck() {
  return new Promise((resolve) => {
    const checks = [
      { name: 'Next.js', port: CONFIG.DEV_PORT, url: `http://localhost:${CONFIG.DEV_PORT}/health` },
      { name: 'WebSocket代理', port: CONFIG.WS_PROXY_PORT, url: null }
    ];

    let completedChecks = 0;
    let healthyServices = 0;

    checks.forEach(check => {
      checkPort(check.port).then(available => {
        completedChecks++;
        if (!available) {
          healthyServices++;
          log('success', `${check.name} 服务健康 (端口 ${check.port})`);
        } else {
          log('error', `${check.name} 服务不可用 (端口 ${check.port})`);
        }

        if (completedChecks === checks.length) {
          resolve(healthyServices === checks.length);
        }
      });
    });
  });
}

// 优雅关闭所有服务
function gracefulShutdown() {
  log('info', '正在关闭所有服务...');

  Object.entries(processes).forEach(([name, proc]) => {
    if (proc) {
      log('info', `关闭 ${name} 服务...`);
      proc.kill('SIGINT');
    }
  });

  // 强制退出超时
  setTimeout(() => {
    log('warn', '强制退出服务');
    Object.values(processes).forEach(proc => {
      if (proc) proc.kill('SIGKILL');
    });
    process.exit(1);
  }, 5000);
}

// 重启服务
async function restartServices() {
  retryCount++;
  
  if (retryCount > CONFIG.MAX_RETRIES) {
    log('error', `重试次数超限 (${CONFIG.MAX_RETRIES}次)，请检查配置后手动重启`);
    process.exit(1);
  }

  log('warn', `第 ${retryCount} 次重启服务...`);
  
  gracefulShutdown();
  
  setTimeout(async () => {
    try {
      await startServices();
    } catch (error) {
      log('error', `重启失败: ${error.message}`);
      await restartServices();
    }
  }, CONFIG.RESTART_DELAY);
}

// 启动所有服务
async function startServices() {
  try {
    // 1. 环境检查
    checkEnvironment();
    
    // 2. 清理缓存
    cleanCache();
    
    // 3. 检查端口冲突
    log('info', '检查端口占用情况...');
    
    const nextjsPortFree = await checkPort(CONFIG.DEV_PORT);
    const wsProxyPortFree = await checkPort(CONFIG.WS_PROXY_PORT);
    
    if (!nextjsPortFree) {
      log('warn', `端口 ${CONFIG.DEV_PORT} 被占用，尝试终止占用进程`);
      await killPort(CONFIG.DEV_PORT);
    }
    
    if (!wsProxyPortFree) {
      log('warn', `端口 ${CONFIG.WS_PROXY_PORT} 被占用，尝试终止占用进程`);
      await killPort(CONFIG.WS_PROXY_PORT);
    }
    
    // 4. 启动服务（并行启动以加快速度）
    log('info', '启动开发服务...');
    
    await Promise.all([
      startNextJS(),
      startWebSocketProxy(),
    ]);
    
    // 5. 等待服务稳定后再进行健康检查
    log('info', '等待服务稳定...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    log('info', '执行健康检查...');
    const allHealthy = await healthCheck();
    
    if (allHealthy) {
      log('success', '🎉 所有服务启动成功！');
      log('info', `🌐 访问地址: http://localhost:${CONFIG.DEV_PORT}`);
      log('info', `🔌 WebSocket代理: ws://localhost:${CONFIG.WS_PROXY_PORT}/ws-proxy`);
      
      // 重置重试计数
      retryCount = 0;
    } else {
      throw new Error('部分服务启动失败');
    }
    
  } catch (error) {
    log('error', `启动失败: ${error.message}`);
    
    if (retryCount < CONFIG.MAX_RETRIES) {
      log('info', `${CONFIG.RESTART_DELAY / 1000} 秒后重试...`);
      setTimeout(() => restartServices(), CONFIG.RESTART_DELAY);
    } else {
      log('error', '已达到最大重试次数，退出');
      process.exit(1);
    }
  }
}

// 监听进程退出
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error) => {
  log('error', `未捕获异常: ${error.message}`);
  gracefulShutdown();
});

// 监听子进程异常退出
process.on('exit', () => {
  Object.values(processes).forEach(proc => {
    if (proc) proc.kill();
  });
});

// 主程序入口
async function main() {
  try {
    log('info', '='.repeat(60));
    log('info', '🚀 岁阅项目开发环境启动中...');
    log('info', '='.repeat(60));
    
    await startServices();
    
    // 定期健康检查
    setInterval(async () => {
      const healthy = await healthCheck();
      if (!healthy) {
        log('warn', '检测到服务异常，准备重启...');
        await restartServices();
      }
    }, 60000); // 每分钟检查一次
    
  } catch (error) {
    log('error', `启动失败: ${error.message}`);
    process.exit(1);
  }
}

// 启动主程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { startServices, gracefulShutdown, healthCheck };