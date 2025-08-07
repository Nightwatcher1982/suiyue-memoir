import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 直接访问运行时环境变量，不经过config.ts
  const runtimeEnvVars = {
    // CloudBase
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
    NODE_ENV: process.env.NODE_ENV,
    
    // AI服务 - 多种可能的变量名
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
    TONGYI_ACCESS_KEY_ID: process.env.TONGYI_ACCESS_KEY_ID,
    QIANWEN_API_KEY: process.env.QIANWEN_API_KEY,
    
    // 阿里云
    ALIBABA_ACCESS_KEY_ID: process.env.ALIBABA_ACCESS_KEY_ID,
    ALIBABA_ACCESS_KEY_SECRET: process.env.ALIBABA_ACCESS_KEY_SECRET,
    ALIBABA_CLOUD_ACCESS_KEY_ID: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    
    // 科大讯飞
    XFYUN_APP_ID: process.env.XFYUN_APP_ID,
    XFYUN_API_SECRET: process.env.XFYUN_API_SECRET,
    XFYUN_API_KEY: process.env.XFYUN_API_KEY,
    XUNFEI_APP_ID: process.env.XUNFEI_APP_ID,
    XUNFEI_API_SECRET: process.env.XUNFEI_API_SECRET,
    XUNFEI_API_KEY: process.env.XUNFEI_API_KEY,
  };

  // 安全处理敏感信息
  const safeEnvVars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(runtimeEnvVars)) {
    if (value) {
      // 对于敏感的key和secret，只显示前4位和长度
      if (key.includes('SECRET') || key.includes('KEY')) {
        safeEnvVars[key] = `${value.substring(0, 4)}****... (长度:${value.length})`;
      } else {
        safeEnvVars[key] = value;
      }
    } else {
      safeEnvVars[key] = '❌ 未设置';
    }
  }

  // 检查所有环境变量键名（调试用）
  const allEnvKeys = Object.keys(process.env)
    .filter(key => 
      key.includes('DASHSCOPE') ||
      key.includes('TONGYI') ||
      key.includes('QIANWEN') ||
      key.includes('ALIBABA') ||
      key.includes('XFYUN') ||
      key.includes('XUNFEI') ||
      key.includes('CLOUDBASE')
    )
    .sort();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    message: '运行时环境变量检查（直接访问process.env）',
    
    // 运行时环境变量状态
    runtimeEnvVars: safeEnvVars,
    
    // 相关的所有环境变量键名
    relatedEnvKeys: allEnvKeys,
    
    // 运行时信息
    runtime: {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
    },
    
    // 快速配置检查
    quickCheck: {
      hasCloudBaseId: !!process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
      hasDashscopeKey: !!(process.env.DASHSCOPE_API_KEY || process.env.TONGYI_ACCESS_KEY_ID),
      hasAlibabaKey: !!process.env.ALIBABA_ACCESS_KEY_ID,
      hasXfyunKey: !!process.env.XFYUN_APP_ID
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}