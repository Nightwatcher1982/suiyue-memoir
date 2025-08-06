const fs = require('fs');
const path = require('path');

// 创建一个简单的测试图片（1x1像素PNG）
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const testImageBuffer = Buffer.from(testImageBase64, 'base64');

async function testHandwritingOCR() {
  try {
    console.log('🧪 开始测试手写体识别API...');
    
    // 创建FormData
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加图片文件
    form.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const fetch = (await import('node-fetch')).default;
    // 先测试通用OCR
    console.log('🧪 测试通用OCR...');
    const generalResponse = await fetch('https://suiyue-177148-6-1371243086.sh.run.tcloudbase.com/api/ocr', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('📋 通用OCR响应状态:', generalResponse.status);
    const generalResponseText = await generalResponse.text();
    console.log('📋 通用OCR响应:', generalResponseText);
    
    console.log('\n🖋️ 测试手写体OCR...');
    const response = await fetch('https://suiyue-177148-6-1371243086.sh.run.tcloudbase.com/api/ocr-handwriting', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('📋 响应状态:', response.status);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📋 响应内容:', responseText);
    
    if (!response.ok) {
      console.error('❌ 请求失败:', response.status, responseText);
    } else {
      console.log('✅ 请求成功');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('📊 解析后的响应:', JSON.stringify(jsonResponse, null, 2));
      } catch (parseError) {
        console.log('⚠️ 响应不是JSON格式');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testHandwritingOCR();