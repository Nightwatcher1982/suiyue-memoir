/**
 * 数据库连接测试脚本
 */

const cloud = require('@cloudbase/node-sdk');

const app = cloud.init({
  env: process.env.CLOUDBASE_ENV_ID || 'suiyue-memoir-dev-3e9aoud20837ef',
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY
});

const db = app.database();

const collections = [
  'users',
  'memoirProjects', 
  'chapters',
  'photos',
  'audioRecordings',
  'userSessions'
];

async function testDatabaseConnection() {
  console.log('🔄 开始测试数据库连接...');
  
  try {
    for (const collectionName of collections) {
      try {
        console.log(`\n📝 测试集合: ${collectionName}`);
        
        const testDoc = {
          type: 'connection_test',
          timestamp: new Date(),
          message: `测试${collectionName}集合连接`
        };
        
        console.log(`   添加测试数据...`);
        const result = await db.collection(collectionName).add(testDoc);
        console.log(`   ✅ 成功创建测试文档，ID: ${result.id}`);
        
        console.log(`   查询测试数据...`);
        const queryResult = await db.collection(collectionName)
          .where({ type: 'connection_test' })
          .get();
        console.log(`   ✅ 查询成功，找到 ${queryResult.data.length} 条记录`);
        
        console.log(`   清理测试数据...`);
        await db.collection(collectionName).doc(result.id).remove();
        console.log(`   ✅ 测试数据清理完成`);
        
      } catch (error) {
        console.error(`   ❌ 集合 ${collectionName} 测试失败:`, error.message);
      }
    }
    
    console.log('\n🎉 数据库连接测试完成！');
    
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 CloudBase 数据库测试脚本');
  console.log('📋 环境ID: suiyue-memoir-dev-3e9aoud20837ef\n');
  
  try {
    await testDatabaseConnection();
    console.log('\n🎉 所有测试完成！数据库配置正常。');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
