'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { storageService } from '@/lib/cloudbase/storage';
import { getCloudbase, getStorage } from '@/lib/cloudbase/config';
import { authService } from '@/lib/cloudbase/auth';

export function CloudStorageTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const testCloudbaseConnection = async () => {
    setTesting(true);
    setTestResult('🔍 开始CloudBase连接诊断...\n');
    let authStatus = '未检查';
    
    try {
      // 步骤1: 检查环境变量
      const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID;
      setTestResult(prev => prev + `✅ 环境ID: ${envId}\n`);
      
      if (!envId) {
        throw new Error('环境变量NEXT_PUBLIC_CLOUDBASE_ENV_ID未设置');
      }
      
      // 步骤2: 初始化CloudBase实例
      setTestResult(prev => prev + '🚀 正在初始化CloudBase实例...\n');
      const cloudbaseInstance = getCloudbase();
      
      if (!cloudbaseInstance) {
        throw new Error('CloudBase实例初始化失败');
      }
      setTestResult(prev => prev + '✅ CloudBase实例初始化成功\n');
      
      // 步骤3: 获取存储服务
      setTestResult(prev => prev + '📦 正在获取存储服务...\n');
      const storage = getStorage();
      
      if (!storage) {
        throw new Error('存储服务获取失败');
      }
      setTestResult(prev => prev + '✅ 存储服务获取成功\n');
      
      // 步骤4: 测试存储服务方法
      setTestResult(prev => prev + '🔧 检查存储服务方法...\n');
      
      if (typeof storage.uploadFile !== 'function') {
        throw new Error('storage.uploadFile方法不存在');
      }
      if (typeof storage.deleteFile !== 'function') {
        throw new Error('storage.deleteFile方法不存在');
      }
      if (typeof storage.getTempFileURL !== 'function') {
        throw new Error('storage.getTempFileURL方法不存在');
      }
      
      setTestResult(prev => prev + '✅ 存储服务方法检查通过 (使用CloudBase v2 API)\n\n');
      
      // 步骤5: 身份验证检查
      setTestResult(prev => prev + '🔐 检查身份验证状态...\n');
      authStatus = '未认证';
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          authStatus = `已认证 (${currentUser.uid || currentUser.openid || 'anonymous'})`;
          setTestResult(prev => prev + `✅ 用户已认证: ${currentUser.uid || currentUser.openid || 'anonymous'}\n`);
          setTestResult(prev => prev + `   登录类型: ${currentUser.loginType || '未知'}\n`);
        } else {
          setTestResult(prev => prev + '⚠️ 用户未认证，尝试匿名登录...\n');
          const user = await authService.ensureAuthenticated();
          if (user) {
            authStatus = `匿名登录 (${user.uid || user.openid || 'anonymous'})`;
            setTestResult(prev => prev + `✅ 匿名登录成功: ${user.uid || user.openid || 'anonymous'}\n`);
            setTestResult(prev => prev + `   登录类型: ${user.loginType || '匿名'}\n`);
          } else {
            authStatus = '认证失败';
            setTestResult(prev => prev + '❌ 匿名登录失败，继续无认证测试\n');
          }
        }
      } catch (authError) {
        authStatus = `认证错误: ${authError instanceof Error ? authError.message : authError}`;
        setTestResult(prev => prev + `❌ 身份验证失败: ${authError instanceof Error ? authError.message : authError}\n`);
      }
      
      setTestResult(prev => prev + `📊 当前认证状态: ${authStatus}\n\n`);
      
      // 步骤6: 创建测试文件并上传
      setTestResult(prev => prev + '📸 正在创建测试图片...\n');
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = '#FF0000';
      ctx!.fillRect(0, 0, 1, 1);
      
      // 转换为Blob
      const testBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });
      
      const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
      setTestResult(prev => prev + '✅ 测试图片创建成功\n');
      
      setTestResult(prev => prev + '⬆️ 正在上传测试图片...\n');
      
      // 测试上传
      const result = await storageService.uploadPhoto(testFile, 'test-user', 'test-chapter');
      
      setTestResult(prev => prev + `🎉 云存储连接测试成功！
文件ID: ${result.fileId}
下载URL: ${result.downloadUrl}
文件大小: ${result.fileSize} bytes\n`);
      
      // 清理测试文件
      setTestResult(prev => prev + '🧹 正在清理测试文件...\n');
      setTimeout(async () => {
        try {
          await storageService.deleteFile(result.fileId);
          setTestResult(prev => prev + '✅ 测试文件清理完成\n\n🎯 CloudBase云存储连接正常，可以正常使用！');
        } catch (error) {
          console.warn('清理测试文件失败:', error);
          setTestResult(prev => prev + `⚠️ 测试文件清理失败: ${error instanceof Error ? error.message : error}\n但上传功能正常！`);
        }
      }, 2000);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setTestResult(prev => prev + `\n❌ 测试失败: ${errorMsg}\n\n`);
      
      // 分析错误类型并提供针对性建议
      if (errorMsg.includes('PERMISSION_DENIED')) {
        if (errorMsg.includes('Unauthenticated access is denied')) {
          setTestResult(prev => prev + `🔍 权限分析:\n`);
          setTestResult(prev => prev + `• 错误类型: 未认证访问被拒绝\n`);
          setTestResult(prev => prev + `• 认证状态: ${authStatus || '未检查'}\n\n`);
          
          setTestResult(prev => prev + `💡 解决方案:\n`);
          setTestResult(prev => prev + `1. 检查CloudBase环境中的「对象存储」权限配置\n`);
          setTestResult(prev => prev + `2. 确认安全规则格式正确:\n`);
          setTestResult(prev => prev + `   {"read": true, "write": true} - 完全开放\n`);
          setTestResult(prev => prev + `   或 {"read": true, "write": "auth != null"} - 需认证写入\n`);
          setTestResult(prev => prev + `3. 确认匿名登录功能已在「身份验证」中启用\n`);
          setTestResult(prev => prev + `4. 检查环境ID是否正确: ${process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID}\n`);
        }
      }
      
      console.error('CloudBase连接测试失败:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">☁️ 云存储连接测试</h3>
      
      <div className="space-y-4">
        <Button 
          onClick={testCloudbaseConnection}
          disabled={testing}
          className="w-full"
        >
          {testing ? '诊断中...' : '开始CloudBase连接诊断'}
        </Button>
        
        {testResult && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>环境信息：</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>环境ID: {process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID}</li>
            <li>区域: {process.env.NEXT_PUBLIC_TCB_REGION}</li>
            <li>存储桶: {process.env.NEXT_PUBLIC_CLOUDBASE_STORAGE_BUCKET}</li>
          </ul>
          
          {testResult.includes('PERMISSION_DENIED') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">❌ 权限配置失败</h4>
              <div className="text-red-800 text-xs space-y-1">
                <p>如果仍然出现权限错误，请检查：</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>确认在CloudBase控制台中权限规则已保存</li>
                  <li>刷新浏览器页面重新测试</li>
                  <li>检查环境ID是否正确</li>
                </ol>
              </div>
            </div>
          )}
          
          {testResult.includes('🎯 CloudBase云存储连接正常') && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">✅ 配置成功</h4>
              <div className="text-green-800 text-xs">
                <p>CloudBase云存储已正确配置，现在可以在应用中正常使用文件上传和照片修复功能了！</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔒 安全规则优化建议</h4>
            <div className="text-blue-800 text-xs space-y-2">
              <p>当前配置 <code className="bg-blue-100 px-1 rounded">{'{"read": true, "write": true}'}</code> 完全开放，建议升级为：</p>
              
              <div className="space-y-2">
                <div>
                  <p className="font-medium">推荐配置（需认证写入）：</p>
                  <code className="bg-blue-100 p-1 rounded text-xs block">{'{"read": true, "write": "auth != null"}'}</code>
                  <p className="text-xs mt-1">• 所有人可查看，只有登录用户可上传</p>
                </div>
                
                <div>
                  <p className="font-medium">高安全配置（私有存储）：</p>
                  <code className="bg-blue-100 p-1 rounded text-xs block">{`{"read": "resource.openid == auth.uid", "write": "resource.openid == auth.uid"}`}</code>
                  <p className="text-xs mt-1">• 只有文件所有者可读写</p>
                </div>
              </div>
              
              <p className="text-xs">
                💡 如需启用更安全的规则，请在CloudBase控制台开启「匿名登录」功能
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}