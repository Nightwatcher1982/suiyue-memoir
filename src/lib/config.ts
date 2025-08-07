// 云端API配置
// 完全依赖环境变量，确保安全性

function getEmptyConfig() {
  return {
    XFYUN: { APP_ID: '', API_SECRET: '', API_KEY: '' },
    ALIBABA: { ACCESS_KEY_ID: '', ACCESS_KEY_SECRET: '' },
    DASHSCOPE: { API_KEY: '' }
  };
}

export const API_CONFIG = {
  // 科大讯飞配置
  XFYUN: {
    APP_ID: process.env.XFYUN_APP_ID || process.env.XUNFEI_APP_ID || '',
    API_SECRET: process.env.XFYUN_API_SECRET || process.env.XUNFEI_API_SECRET || '',
    API_KEY: process.env.XFYUN_API_KEY || process.env.XUNFEI_API_KEY || ''
  },
  
  // 阿里云配置
  ALIBABA: {
    ACCESS_KEY_ID: process.env.ALIBABA_ACCESS_KEY_ID || '',
    ACCESS_KEY_SECRET: process.env.ALIBABA_ACCESS_KEY_SECRET || ''
  },
  
  // 通义千问配置 - 支持两种环境变量名
  DASHSCOPE: {
    API_KEY: process.env.DASHSCOPE_API_KEY || process.env.TONGYI_ACCESS_KEY_ID || ''
  }
};

// 检查配置完整性
export function checkConfig() {
  const status = {
    xfyun: {
      complete: !!(API_CONFIG.XFYUN.APP_ID && API_CONFIG.XFYUN.API_SECRET && API_CONFIG.XFYUN.API_KEY),
      appId: !!API_CONFIG.XFYUN.APP_ID,
      apiSecret: !!API_CONFIG.XFYUN.API_SECRET,
      apiKey: !!API_CONFIG.XFYUN.API_KEY
    },
    alibaba: {
      complete: !!(API_CONFIG.ALIBABA.ACCESS_KEY_ID && API_CONFIG.ALIBABA.ACCESS_KEY_SECRET),
      keyId: !!API_CONFIG.ALIBABA.ACCESS_KEY_ID,
      keySecret: !!API_CONFIG.ALIBABA.ACCESS_KEY_SECRET
    },
    dashscope: {
      complete: !!API_CONFIG.DASHSCOPE.API_KEY,
      apiKey: !!API_CONFIG.DASHSCOPE.API_KEY
    }
  };
  
  console.log('📊 API配置状态检查:', status);
  return status;
}