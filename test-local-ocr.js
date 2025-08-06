const fs = require('fs');

// 创建一个符合阿里云OCR要求的测试图片（50x20像素，包含文字的PNG）
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAADIAAAAUCAYAAADPym6aAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFkSURBVEiJ7ZY9SwJxFMafR0QQCQKJwqFBcAmHhgaHoKGhIVqCINqCpqYgaGhoiJaGhmiLhmiLFqe2aIu2aGhoaGiLtmiItmiLtmiLtmgLgv7Bf+A5555z4Hme3zkH+A8jImLmTsQ8RMQ8RMQ8RMQ8RMQ8RMQ8RMQ8RMQ8RMTHzMyIiBgRMSIiZkZExIiImBkRESMiYkZExIiImBERMSIiZkZExIiImBERMSIiZkZExIiImBERMSIiZkZExIiImBERMSIiZkZExIiImBkRMSMiYkZExIyIiBkRETMiImZERMyIiJgRETEjImJGRMSMiIgZEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYEREzIiJmRETMiIiYERExIyJiRkTEzH8Ag7lNZgAAAABJRU5ErkJggg==';
const testImageBuffer = Buffer.from(testImageBase64, 'base64');

async function testLocalHandwritingOCR() {
  try {
    console.log('🧪 测试本地手写体识别API...');
    
    // 创建FormData
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加图片文件
    form.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const fetch = (await import('node-fetch')).default;
    console.log('🧪 测试新的Qwen-VL-OCR手写体识别API...');
    const response = await fetch('http://localhost:3000/api/ocr-handwriting-v2', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('📋 响应状态:', response.status);
    const responseText = await response.text();
    console.log('📋 响应内容:', responseText);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testLocalHandwritingOCR();