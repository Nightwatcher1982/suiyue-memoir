import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 获取所有可能的科大讯飞相关环境变量
  const envVars = {
    // 科大讯飞相关
    XFYUN_APP_ID: process.env.XFYUN_APP_ID,
    XFYUN_API_SECRET: process.env.XFYUN_API_SECRET,
    XFYUN_API_KEY: process.env.XFYUN_API_KEY,
    XUNFEI_APP_ID: process.env.XUNFEI_APP_ID,
    XUNFEI_API_SECRET: process.env.XUNFEI_API_SECRET,
    XUNFEI_API_KEY: process.env.XUNFEI_API_KEY,
    
    // 阿里云相关
    ALIBABA_ACCESS_KEY_ID: process.env.ALIBABA_ACCESS_KEY_ID,
    ALIBABA_ACCESS_KEY_SECRET: process.env.ALIBABA_ACCESS_KEY_SECRET,
    
    // 通义千问相关
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
    TONGYI_ACCESS_KEY_ID: process.env.TONGYI_ACCESS_KEY_ID,
    
    // CloudBase相关
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID,
    
    // Node环境信息
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    
    // 其他可能的变量名变体
    IFLYTEK_APP_ID: process.env.IFLYTEK_APP_ID,
    IFLYTEK_API_SECRET: process.env.IFLYTEK_API_SECRET,
    IFLYTEK_API_KEY: process.env.IFLYTEK_API_KEY
  };

  // 处理敏感信息，只显示是否存在和前几位字符
  const safeEnvVars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      // 对于敏感的key和secret，只显示前4位和长度
      if (key.includes('SECRET') || key.includes('KEY')) {
        safeEnvVars[key] = `${value.substring(0, 4)}****... (长度:${value.length})`;
      } else {
        safeEnvVars[key] = value;
      }
    } else {
      safeEnvVars[key] = '未配置';
    }
  }

  // 检查科大讯飞配置完整性
  const xfyunComplete = !!(
    (process.env.XFYUN_APP_ID || process.env.XUNFEI_APP_ID || '6b59d550') &&
    (process.env.XFYUN_API_SECRET || process.env.XUNFEI_API_SECRET) &&
    (process.env.XFYUN_API_KEY || process.env.XUNFEI_API_KEY)
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.env.VERCEL ? 'Vercel' : 'Other',
    
    // 环境变量状态
    environmentVariables: safeEnvVars,
    
    // 配置完整性检查
    configStatus: {
      xunfei: {
        complete: xfyunComplete,
        appId: !!(process.env.XFYUN_APP_ID || process.env.XUNFEI_APP_ID || '6b59d550'),
        apiSecret: !!(process.env.XFYUN_API_SECRET || process.env.XUNFEI_API_SECRET),
        apiKey: !!(process.env.XFYUN_API_KEY || process.env.XUNFEI_API_KEY)
      },
      alibaba: {
        complete: !!(process.env.ALIBABA_ACCESS_KEY_ID && process.env.ALIBABA_ACCESS_KEY_SECRET),
        keyId: !!process.env.ALIBABA_ACCESS_KEY_ID,
        keySecret: !!process.env.ALIBABA_ACCESS_KEY_SECRET
      },
      dashscope: {
        complete: !!process.env.DASHSCOPE_API_KEY,
        apiKey: !!process.env.DASHSCOPE_API_KEY
      }
    },
    
    // 所有环境变量键名（用于调试）
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('XFYUN') || 
      key.includes('XUNFEI') || 
      key.includes('IFLYTEK') ||
      key.includes('ALIBABA') ||
      key.includes('DASHSCOPE')
    ).sort()
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