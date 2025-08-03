import cloudbase from '@cloudbase/js-sdk/app';
import '@cloudbase/js-sdk/auth';
import '@cloudbase/js-sdk/database';
import '@cloudbase/js-sdk/storage';
import '@cloudbase/js-sdk/functions';

// 获取CloudBase实例 - 延迟初始化
function getCloudbaseInstance() {
  if (typeof window === 'undefined') {
    throw new Error('CloudBase只能在客户端环境中使用');
  }
  
  // 确保环境变量存在
  const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID;
  if (!envId) {
    throw new Error('NEXT_PUBLIC_CLOUDBASE_ENV_ID环境变量未设置');
  }
  
  try {
    const app = cloudbase.init({
      env: envId,
    });
    
    console.log('✅ CloudBase初始化成功，使用内置SMS认证');
    
    return app;
  } catch (error) {
    console.error('CloudBase初始化失败:', error);
    throw new Error(`CloudBase初始化失败: ${error instanceof Error ? error.message : error}`);
  }
}

// 单例模式 - 确保CloudBase实例和服务只初始化一次
let cloudbase_instance: any = null;
let auth_instance: any = null;
let database_instance: any = null;
let storage_instance: any = null;
let functions_instance: any = null;

// 重置所有实例（用于调试）
export function resetCloudBaseInstances() {
  console.log('🔄 重置所有CloudBase实例...');
  cloudbase_instance = null;
  auth_instance = null;
  database_instance = null;
  storage_instance = null;
  functions_instance = null;
}

export function getCloudbase() {
  if (!cloudbase_instance && typeof window !== 'undefined') {
    console.log('🏗️  创建新的CloudBase实例...');
    cloudbase_instance = getCloudbaseInstance();
  }
  return cloudbase_instance;
}

// 导出cloudbase实例供其他文件使用
export { cloudbase_instance as cloudbase };

// 获取各种服务实例的函数 - 确保每个服务只有一个实例
export const getAuth = () => {
  if (!auth_instance) {
    console.log('🔐 创建新的Auth实例...');
    const instance = getCloudbase();
    if (!instance) throw new Error('CloudBase未初始化');
    auth_instance = instance.auth();
  }
  return auth_instance;
};

export const getDatabase = () => {
  if (!database_instance) {
    const instance = getCloudbase();
    if (!instance) throw new Error('CloudBase未初始化');
    database_instance = instance.database();
  }
  return database_instance;
};

// 注意：CloudBase v2已弃用storage()方法，直接使用app实例的存储方法
export const getStorage = () => {
  if (!storage_instance) {
    const instance = getCloudbase();
    if (!instance) throw new Error('CloudBase未初始化');
    
    // 返回包含新API方法的对象
    storage_instance = {
      uploadFile: instance.uploadFile.bind(instance),
      deleteFile: instance.deleteFile.bind(instance),
      getTempFileURL: instance.getTempFileURL.bind(instance),
      downloadFile: instance.downloadFile ? instance.downloadFile.bind(instance) : null,
    };
  }
  return storage_instance;
};

export const getFunctions = () => {
  const instance = getCloudbase();
  if (!instance) throw new Error('CloudBase未初始化');
  
  // CloudBase JS SDK直接使用app实例的callFunction方法
  return {
    callFunction: instance.callFunction.bind(instance)
  };
}; 