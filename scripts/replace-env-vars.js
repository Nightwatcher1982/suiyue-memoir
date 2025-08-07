#!/usr/bin/env node

/**
 * 环境变量替换脚本
 * 将cloudbaserc.json中的占位符替换为实际的环境变量值
 */

const fs = require('fs');
const path = require('path');

const cloudbaseConfigPath = path.join(__dirname, '../cloudbaserc.json');

console.log('🔧 开始替换cloudbaserc.json中的环境变量占位符...');

try {
  // 读取配置文件
  const configContent = fs.readFileSync(cloudbaseConfigPath, 'utf8');
  let config = JSON.parse(configContent);
  
  console.log('📝 原始配置:', JSON.stringify(config.framework.inputs.envVariables, null, 2));
  
  // 替换环境变量占位符
  const envVariables = config.framework.inputs.envVariables;
  const replacedEnvVariables = {};
  
  for (const [key, value] of Object.entries(envVariables)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      // 提取占位符中的环境变量名
      const envVarName = value.slice(2, -2);
      const envVarValue = process.env[envVarName];
      
      if (envVarValue) {
        replacedEnvVariables[key] = envVarValue;
        console.log(`✅ ${key}: ${envVarName} -> ${envVarValue.substring(0, 4)}****`);
      } else {
        replacedEnvVariables[key] = '';
        console.log(`⚠️  ${key}: ${envVarName} -> 未设置，使用空值`);
      }
    } else {
      replacedEnvVariables[key] = value;
    }
  }
  
  // 更新配置
  config.framework.inputs.envVariables = replacedEnvVariables;
  
  // 写回文件
  const updatedContent = JSON.stringify(config, null, 2);
  fs.writeFileSync(cloudbaseConfigPath, updatedContent);
  
  console.log('✅ 环境变量替换完成');
  console.log('📝 更新后的配置:', JSON.stringify(replacedEnvVariables, null, 2));
  
} catch (error) {
  console.error('❌ 环境变量替换失败:', error.message);
  process.exit(1);
}