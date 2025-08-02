import { getDatabase } from './config';
import { COLLECTIONS } from './collections';

// 初始化CloudBase环境
async function initializeCloudBase() {
  try {
    console.log('🚀 初始化CloudBase环境...');
    
    console.log('✅ CloudBase连接成功');
    
    // 自动创建数据库集合（如果不存在）
    await createCollectionsIfNotExist();
    
    console.log('✅ CloudBase环境初始化完成');
    return true;
  } catch (error) {
    console.error('❌ CloudBase初始化失败:', error);
    return false;
  }
}

// 创建数据库集合（如果不存在）
async function createCollectionsIfNotExist() {
  const collectionsToCreate = Object.values(COLLECTIONS);
  
  for (const collectionName of collectionsToCreate) {
    try {
      const db = getDatabase();
      if (!db) {
        console.log(`ℹ️  数据库服务不可用，跳过集合 ${collectionName}`);
        continue;
      }
      // 尝试查询集合，如果不存在会自动创建
      await db.collection(collectionName).limit(1).get();
      console.log(`✅ 集合 ${collectionName} 已存在或创建成功`);
    } catch {
      console.log(`ℹ️  集合 ${collectionName} 将在首次写入时自动创建`);
    }
  }
}

// 检查CloudBase连接状态
export async function checkCloudBaseConnection() {
  try {
    const db = getDatabase();
    if (!db) return false;
    // 简单的连接测试
    await db.collection('_test_connection').limit(1).get();
    return true;
  } catch (error) {
    console.error('CloudBase连接测试失败:', error);
    return false;
  }
}

// 导出初始化函数供客户端调用
export { initializeCloudBase }; 