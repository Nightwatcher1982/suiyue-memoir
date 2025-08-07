#!/usr/bin/env node

/**
 * 岁阅项目环境变量管理工具
 * 统一管理本地开发、云端部署、CI/CD环境的API密钥和配置
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG = {
  ENV_FILE: '.env.local',
  TEMPLATE_FILE: '.env.local.template',
  BACKUP_DIR: '.env-backups',
  ENCRYPTION_KEY: process.env.ENV_ENCRYPTION_KEY,
};

// 工具函数
function log(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = { info: '📝', error: '❌', success: '✅', warn: '⚠️' }[level] || 'ℹ️';
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

// 读取环境变量文件
function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        vars[key.trim()] = value.trim();
      }
    });
    
    return vars;
  } catch (error) {
    log('error', `读取文件失败 ${filePath}: ${error.message}`);
    return null;
  }
}

// 写入环境变量文件
function writeEnvFile(filePath, vars, comments = {}) {
  try {
    let content = '';
    
    // 添加文件头注释
    content += '# 岁阅项目环境变量配置\n';
    content += `# 生成时间: ${new Date().toLocaleString()}\n`;
    content += '# 警告: 此文件包含敏感信息，请不要提交到版本控制系统\n\n';
    
    // 按组织结构写入变量
    const groups = {
      'CloudBase': ['NEXT_PUBLIC_CLOUDBASE_ENV_ID', 'NEXT_PUBLIC_TCB_ENV_ID', 'NEXT_PUBLIC_TCB_REGION', 'NEXT_PUBLIC_CLOUDBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_CLOUDBASE_STORAGE_REGION'],
      'AI服务': ['TONGYI_ACCESS_KEY_ID', 'DASHSCOPE_API_KEY'],
      '阿里云': ['ALIBABA_ACCESS_KEY_ID', 'ALIBABA_ACCESS_KEY_SECRET', 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET'],
      '语音服务': ['XFYUN_APP_ID', 'XFYUN_API_SECRET', 'XFYUN_API_KEY'],
      '其他服务': ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'WECHAT_APP_ID', 'WECHAT_APP_SECRET', 'OCR_SPACE_API_KEY'],
      '开发配置': ['NODE_ENV', 'NEXT_TELEMETRY_DISABLED']
    };
    
    for (const [groupName, keys] of Object.entries(groups)) {
      content += `# ====================================\n`;
      content += `# ${groupName}\n`;
      content += `# ====================================\n`;
      
      keys.forEach(key => {
        if (vars[key]) {
          if (comments[key]) {
            content += `# ${comments[key]}\n`;
          }
          content += `${key}=${vars[key]}\n`;
        }
      });
      
      content += '\n';
    }
    
    // 添加其他未分组的变量
    Object.keys(vars).forEach(key => {
      const found = Object.values(groups).some(group => group.includes(key));
      if (!found) {
        content += `${key}=${vars[key]}\n`;
      }
    });
    
    fs.writeFileSync(path.join(process.cwd(), filePath), content);
    return true;
  } catch (error) {
    log('error', `写入文件失败 ${filePath}: ${error.message}`);
    return false;
  }
}

// 验证环境变量配置
function validateEnvConfig(vars) {
  const required = {
    'NEXT_PUBLIC_CLOUDBASE_ENV_ID': 'CloudBase环境ID',
    'DASHSCOPE_API_KEY': 'AI服务API密钥',
  };
  
  const optional = {
    'ALIBABA_ACCESS_KEY_ID': '阿里云访问密钥',
    'XFYUN_APP_ID': '科大讯飞应用ID',
  };
  
  const issues = [];
  const warnings = [];
  
  // 检查必需的配置
  Object.entries(required).forEach(([key, description]) => {
    if (!vars[key] || vars[key].includes('your-') || vars[key] === '' || vars[key] === 'undefined') {
      issues.push(`❌ ${description} (${key}) 未正确配置`);
    }
  });
  
  // 检查可选配置
  Object.entries(optional).forEach(([key, description]) => {
    if (!vars[key] || vars[key].includes('your-') || vars[key] === '' || vars[key] === 'undefined') {
      warnings.push(`⚠️  ${description} (${key}) 未配置，相关功能将使用模拟响应`);
    }
  });
  
  return { issues, warnings };
}

// 创建备份
function createBackup() {
  if (!fileExists(CONFIG.ENV_FILE)) {
    return false;
  }
  
  const backupDir = path.join(process.cwd(), CONFIG.BACKUP_DIR);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `env-backup-${timestamp}.txt`);
  
  try {
    fs.copyFileSync(
      path.join(process.cwd(), CONFIG.ENV_FILE),
      backupFile
    );
    log('success', `环境配置已备份到: ${backupFile}`);
    return true;
  } catch (error) {
    log('error', `备份失败: ${error.message}`);
    return false;
  }
}

// 初始化环境配置
function initEnvConfig() {
  log('info', '初始化环境配置...');
  
  if (fileExists(CONFIG.ENV_FILE)) {
    log('warn', `${CONFIG.ENV_FILE} 已存在`);
    const vars = readEnvFile(CONFIG.ENV_FILE);
    if (vars) {
      const { issues, warnings } = validateEnvConfig(vars);
      
      if (issues.length > 0) {
        log('error', '发现配置问题:');
        issues.forEach(issue => console.log(`  ${issue}`));
      }
      
      if (warnings.length > 0) {
        log('warn', '配置警告:');
        warnings.forEach(warning => console.log(`  ${warning}`));
      }
      
      if (issues.length === 0) {
        log('success', '环境配置验证通过');
      }
    }
    return true;
  }
  
  if (!fileExists(CONFIG.TEMPLATE_FILE)) {
    log('error', `模板文件 ${CONFIG.TEMPLATE_FILE} 不存在`);
    return false;
  }
  
  try {
    fs.copyFileSync(
      path.join(process.cwd(), CONFIG.TEMPLATE_FILE),
      path.join(process.cwd(), CONFIG.ENV_FILE)
    );
    log('success', `已创建 ${CONFIG.ENV_FILE} 配置文件`);
    log('warn', '请编辑 .env.local 文件，填入真实的API密钥');
    return true;
  } catch (error) {
    log('error', `创建配置文件失败: ${error.message}`);
    return false;
  }
}

// 检查敏感信息
function checkSensitiveInfo() {
  log('info', '检查敏感信息泄露风险...');
  
  const sensitiveFiles = [
    CONFIG.ENV_FILE,
    'cloudbaserc.json'
  ];
  
  const issues = [];
  
  sensitiveFiles.forEach(file => {
    if (fileExists(file)) {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
      
      // 检查是否包含真实的API密钥模式
      const patterns = [
        /sk-[a-f0-9]{32}/g, // DashScope API Key
        /LTAI[a-zA-Z0-9]{16,}/g, // 阿里云Access Key ID
        /[a-zA-Z0-9]{30,}/g, // 长字符串可能是密钥
      ];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            if (match.length > 10 && !match.includes('your-') && !match.includes('{{')) {
              issues.push(`${file} 可能包含真实密钥: ${match.substring(0, 10)}...`);
            }
          });
        }
      });
    }
  });
  
  if (issues.length > 0) {
    log('error', '发现敏感信息泄露风险:');
    issues.forEach(issue => console.log(`  ❌ ${issue}`));
    return false;
  } else {
    log('success', '敏感信息检查通过');
    return true;
  }
}

// 生成CI/CD环境变量设置指南
function generateCIGuide() {
  log('info', '生成CI/CD环境变量设置指南...');
  
  const vars = readEnvFile(CONFIG.TEMPLATE_FILE);
  if (!vars) {
    log('error', '无法读取模板文件');
    return false;
  }
  
  const ciGuide = `# CI/CD 环境变量配置指南

## GitHub Actions 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下环境变量:

### 必需的环境变量:
${Object.keys(vars).filter(key => 
  key.includes('TONGYI') || 
  key.includes('DASHSCOPE') || 
  key.includes('ALIBABA') ||
  key.includes('CLOUDBASE')
).map(key => `- \`${key}\`: ${vars[key].replace(/your-.*/, '[填入真实值]')}`).join('\n')}

### 可选的环境变量:
${Object.keys(vars).filter(key => 
  key.includes('XFYUN') || 
  key.includes('OCR') ||
  key.includes('WECHAT')
).map(key => `- \`${key}\`: ${vars[key].replace(/your-.*/, '[填入真实值]')}`).join('\n')}

## CloudBase 容器环境变量

在CloudBase控制台的容器服务中设置环境变量:

\`\`\`bash
# 通过命令行设置
tcb env:config set --env suiyue-memoir-dev-3e9aoud20837ef --key TONGYI_ACCESS_KEY_ID --value "your-api-key"
tcb env:config set --env suiyue-memoir-dev-3e9aoud20837ef --key ALIBABA_ACCESS_KEY_ID --value "your-access-key"
tcb env:config set --env suiyue-memoir-dev-3e9aoud20837ef --key ALIBABA_ACCESS_KEY_SECRET --value "your-secret"
\`\`\`

## 安全建议

1. 🔒 永远不要在代码中硬编码API密钥
2. 🔄 定期更换API密钥
3. 👥 限制API密钥的访问权限
4. 📊 监控API密钥的使用情况
5. 🗂️ 将 .env.local 添加到 .gitignore 中

## 环境验证

运行以下命令验证环境配置:

\`\`\`bash
npm run env:check
\`\`\`
`;

  try {
    fs.writeFileSync(path.join(process.cwd(), 'ENV_SETUP_GUIDE.md'), ciGuide);
    log('success', '已生成 ENV_SETUP_GUIDE.md 配置指南');
    return true;
  } catch (error) {
    log('error', `生成指南失败: ${error.message}`);
    return false;
  }
}

// 主命令处理
function handleCommand(command, args) {
  switch (command) {
    case 'init':
      return initEnvConfig();
    
    case 'check':
      if (!fileExists(CONFIG.ENV_FILE)) {
        log('error', `${CONFIG.ENV_FILE} 不存在，请先运行: npm run env:init`);
        return false;
      }
      const vars = readEnvFile(CONFIG.ENV_FILE);
      if (vars) {
        const { issues, warnings } = validateEnvConfig(vars);
        
        if (issues.length > 0) {
          log('error', '配置验证失败:');
          issues.forEach(issue => console.log(`  ${issue}`));
          return false;
        }
        
        if (warnings.length > 0) {
          warnings.forEach(warning => console.log(`  ${warning}`));
        }
        
        log('success', '环境配置验证通过');
        return checkSensitiveInfo();
      }
      return false;
    
    case 'backup':
      return createBackup();
    
    case 'guide':
      return generateCIGuide();
    
    case 'secure':
      return checkSensitiveInfo();
    
    default:
      console.log(`
🔧 岁阅项目环境变量管理工具

用法: node scripts/env-manager.js <command>

命令:
  init     初始化环境配置文件
  check    验证环境配置
  backup   备份当前环境配置
  guide    生成CI/CD配置指南
  secure   检查敏感信息泄露风险

示例:
  node scripts/env-manager.js init
  node scripts/env-manager.js check
  node scripts/env-manager.js guide
      `);
      return true;
  }
}

// 主程序入口
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  const success = handleCommand(command, args);
  process.exit(success ? 0 : 1);
}

module.exports = {
  initEnvConfig,
  validateEnvConfig,
  checkSensitiveInfo,
  generateCIGuide,
};