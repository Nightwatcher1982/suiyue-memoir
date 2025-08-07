// 测试云上手写识别API
async function testCloudHandwritingAPI() {
  try {
    console.log('🧪 测试云上手写识别API...');
    
    // 创建一个包含文字的简单图片Base64
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACqNX6+AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAOGSURBVHic7ZpNaBNBFMefJBE/wIOKB2/ixYMHL148eLAePHjw4MGLBw9ePHjw4MGLBw9ePHjw4MGLBw9ePHjw4sGDBw9ePHjw4MGLBw9ePHjw4MGDB2/ePBjbTdJmk2yazWYmm83O/H8wZGbfvHnz3rw3781sEgCAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAP8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wEAAAAASUVORK5CYII=';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    // 创建FormData
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加图片文件
    form.append('image', testImageBuffer, {
      filename: 'handwriting-test.png',
      contentType: 'image/png'
    });
    
    const fetch = (await import('node-fetch')).default;
    
    console.log('📤 发送请求到云上API...');
    console.log('⏰ 开始时间:', new Date().toISOString());
    
    const response = await fetch('https://suiyue-177148-6-1371243086.sh.run.tcloudbase.com/api/ocr-handwriting-v2', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 60000 // 1分钟超时
    });
    
    console.log('⏰ 响应时间:', new Date().toISOString());
    console.log('📋 响应状态:', response.status);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📋 响应长度:', responseText.length);
    console.log('📋 响应内容:', responseText.substring(0, 2000), responseText.length > 2000 ? '...' : '');
    
    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('✅ 成功解析JSON响应');
        console.log('🔍 识别结果:', jsonResponse.text || '(无文本)');
        console.log('📊 置信度:', jsonResponse.confidence);
        console.log('🆔 请求ID:', jsonResponse.requestId);
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError.message);
      }
    } else {
      console.error('❌ HTTP错误:', response.status);
      // 尝试解析错误响应
      try {
        const errorResponse = JSON.parse(responseText);
        console.error('🔍 错误详情:', errorResponse);
      } catch (e) {
        console.error('🔍 原始错误响应:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('❌ 完整错误:', error);
  }
}

testCloudHandwritingAPI();