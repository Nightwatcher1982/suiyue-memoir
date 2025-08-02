// CloudBase 自动配置脚本
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 数据库集合配置
const collections = [
  'users',
  'memoir_projects', 
  'chapters',
  'photos',
  'audio_recordings',
  'characters'
];

// 权限规则配置
const permissionRules = {
  users: {
    read: "auth.uid != null && resource.id == auth.uid",
    write: "auth.uid != null && resource.id == auth.uid"
  },
  memoir_projects: {
    read: "auth.uid != null && resource.userId == auth.uid",
    write: "auth.uid != null && resource.userId == auth.uid"
  },
  chapters: {
    read: "auth.uid != null && get(`database.memoir_projects.${resource.projectId}`).userId == auth.uid",
    write: "auth.uid != null && get(`database.memoir_projects.${resource.projectId}`).userId == auth.uid"
  },
  photos: {
    read: "auth.uid != null",
    write: "auth.uid != null"
  },
  audio_recordings: {
    read: "auth.uid != null",
    write: "auth.uid != null"
  },
  characters: {
    read: "auth.uid != null && get(`database.memoir_projects.${resource.projectId}`).userId == auth.uid",
    write: "auth.uid != null && get(`database.memoir_projects.${resource.projectId}`).userId == auth.uid"
  }
};

async function setupCloudBase(envId) {
  console.log('🚀 开始配置CloudBase环境...');
  
  try {
    // 1. 创建数据库集合
    console.log('\n📊 创建数据库集合...');
    for (const collection of collections) {
      try {
        await execPromise(`npx cloudbase database:createCollection ${collection} -e ${envId}`);
        console.log(`✅ 集合 ${collection} 创建成功`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  集合 ${collection} 已存在`);
        } else {
          console.log(`❌ 集合 ${collection} 创建失败:`, error.message);
        }
      }
    }

    // 2. 配置数据库权限
    console.log('\n🔐 配置数据库权限...');
    for (const [collection, rules] of Object.entries(permissionRules)) {
      try {
        // 创建权限配置文件
        const ruleConfig = {
          read: rules.read,
          write: rules.write
        };
        
        // 注意：实际的权限配置需要通过控制台或者特定的API设置
        console.log(`ℹ️  集合 ${collection} 权限规则:`, ruleConfig);
      } catch (error) {
        console.log(`❌ 集合 ${collection} 权限配置失败:`, error.message);
      }
    }

    // 3. 列出当前环境信息
    console.log('\n📋 环境信息:');
    const { stdout } = await execPromise(`npx cloudbase env:list -e ${envId}`);
    console.log(stdout);

    console.log('\n✅ CloudBase环境配置完成!');
    
  } catch (error) {
    console.error('❌ 配置失败:', error.message);
  }
}

// 如果直接运行脚本
if (require.main === module) {
  const envId = process.argv[2];
  if (!envId) {
    console.log('请提供环境ID: node cloudbase-setup.js <ENV_ID>');
    process.exit(1);
  }
  setupCloudBase(envId);
}

module.exports = { setupCloudBase }; 