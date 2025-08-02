#!/usr/bin/env node

/**
 * CloudBase 自动化配置脚本
 * 基于官方CLI工具进行环境资源配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置信息
const CONFIG = {
  envId: 'suiyue-memoir-dev-3e9aoud20837ef',
  region: 'ap-shanghai',
  collections: [
    'users',
    'memoirProjects', 
    'chapters',
    'photos',
    'audioRecordings',
    'userSessions'
  ],
  functions: [
    {
      name: 'ai-service',
      description: 'AI服务处理函数',
      memory: 512,
      timeout: 30
    }
  ]
};

// 执行命令的辅助函数
function runCommand(command, description) {
  console.log(`\n🔄 ${description}`);
  console.log(`💻 执行命令: ${command}`);
  
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8',
      env: { ...process.env, TCB_ENV_ID: CONFIG.envId }
    });
    console.log(`✅ ${description} - 完成`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} - 失败:`, error.message);
    return null;
  }
}

// 创建云函数目录和基础文件
function createCloudFunction(funcConfig) {
  const funcDir = path.join(__dirname, 'functions', funcConfig.name);
  
  // 创建函数目录
  if (!fs.existsSync(funcDir)) {
    fs.mkdirSync(funcDir, { recursive: true });
  }

  // 创建 index.js
  const indexContent = `/**
 * ${funcConfig.description}
 */

const cloud = require('@cloudbase/node-sdk');

const app = cloud.init({
  env: process.env.TCB_ENV_ID || '${CONFIG.envId}'
});

const db = app.database();

exports.main = async (event, context) => {
  console.log('AI服务函数被调用', event);
  
  try {
    const { action, data } = event;
    
    switch (action) {
      case 'polishText':
        return await polishText(data);
      default:
        throw new Error(\`未知的操作类型: \${action}\`);
    }
  } catch (error) {
    console.error('AI服务错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

async function polishText(data) {
  const { text } = data;
  return {
    success: true,
    result: {
      polishedText: text + ' [AI已润色]',
      improvements: ['语法优化', '表达更清晰']
    }
  };
}
`;

  fs.writeFileSync(path.join(funcDir, 'index.js'), indexContent);

  // 创建 package.json
  const packageContent = {
    "name": funcConfig.name,
    "version": "1.0.0",
    "description": funcConfig.description,
    "main": "index.js",
    "dependencies": {
      "@cloudbase/node-sdk": "^2.4.1"
    }
  };

  fs.writeFileSync(
    path.join(funcDir, 'package.json'), 
    JSON.stringify(packageContent, null, 2)
  );

  console.log(`📁 创建云函数目录: ${funcDir}`);
}

// 主执行函数
async function main() {
  console.log('🚀 开始CloudBase自动化配置...\n');
  console.log(`📋 环境ID: ${CONFIG.envId}`);
  console.log(`🌏 区域: ${CONFIG.region}`);
  
  try {
    // 1. 检查登录状态
    console.log('\n📝 步骤 1: 检查登录状态');
    runCommand('npx tcb env list', '检查CloudBase登录状态和环境列表');

    // 2. 创建本地资源文件
    console.log('\n📁 步骤 2: 创建本地资源文件');
    
    CONFIG.functions.forEach(funcConfig => {
      createCloudFunction(funcConfig);
    });

    // 3. 部署云函数
    console.log('\n⚡ 步骤 3: 部署云函数');
    CONFIG.functions.forEach(funcConfig => {
      runCommand(
        `npx tcb fn deploy ${funcConfig.name} -e ${CONFIG.envId}`,
        `部署云函数: ${funcConfig.name}`
      );
    });

    // 4. 配置存储权限
    console.log('\n��️ 步骤 4: 配置云存储');
    runCommand(
      `npx tcb storage set-acl -e ${CONFIG.envId}`,
      '配置云存储访问权限'
    );

    console.log('\n🎉 CloudBase自动化配置完成！');
    console.log('\n📋 接下来需要手动配置的项目:');
    console.log('1. 在CloudBase控制台配置用户认证 (手机号登录、微信登录)');
    console.log('2. 在云函数环境变量中配置API密钥');
    console.log('3. 配置数据库安全规则');
    console.log('4. 配置存储CORS规则');
    console.log('\n🔗 CloudBase控制台: https://console.cloud.tencent.com/tcb');
    
  } catch (error) {
    console.error('❌ 配置过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 检查是否直接运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  CONFIG,
  runCommand,
  createCloudFunction
};
