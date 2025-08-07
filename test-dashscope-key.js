// 测试DASHSCOPE API Key是否有效
async function testDashscopeKey() {
  const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
  
  const requestBody = {
    model: "qwen-vl-ocr",
    input: {
      messages: [{
        role: "user",
        content: [{
          text: "hello test"
        }]
      }]
    }
  };

  console.log('🧪 测试DASHSCOPE API Key有效性...');
  console.log('🔑 API Key:', DASHSCOPE_API_KEY.substring(0, 10) + '...');
  console.log('⏰ 开始时间:', new Date().toISOString());

  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });

    console.log('⏰ 响应时间:', new Date().toISOString());
    console.log('📋 响应状态:', response.status);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📋 响应长度:', responseText.length);

    if (response.ok) {
      console.log('✅ API Key 有效');
      const jsonResponse = JSON.parse(responseText);
      console.log('📋 响应示例:', JSON.stringify(jsonResponse, null, 2).substring(0, 500) + '...');
    } else {
      console.error('❌ API Key 验证失败');
      console.error('🔍 错误响应:', responseText);
      
      if (response.status === 401) {
        console.error('🚫 认证失败 - API Key无效或已过期');
      } else if (response.status === 403) {
        console.error('🚫 权限不足 - API Key没有访问此服务的权限');
      }
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testDashscopeKey();