'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getAuth, getCloudbase } from '@/lib/cloudbase/config';

export default function DebugCloudBasePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkCloudBaseConfig = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('🔍 开始检查CloudBase配置...');
      
      // 检查环境变量
      const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID;
      addLog(`📋 环境ID: ${envId || '未设置'}`);
      
      if (!envId) {
        addLog('❌ 错误：NEXT_PUBLIC_CLOUDBASE_ENV_ID 环境变量未设置');
        return;
      }
      
      // 检查CloudBase实例
      try {
        const app = getCloudbase();
        addLog('✅ CloudBase实例初始化成功');
        
        const auth = getAuth();
        addLog('✅ Auth服务获取成功');
        
        // 检查当前用户状态
        const currentUser = auth.currentUser;
        addLog(`👤 当前用户: ${currentUser ? JSON.stringify(currentUser) : '未登录'}`);
        
        // 检查可用方法
        addLog('🔍 检查可用的认证方法:');
        addLog(`- getVerification: ${typeof auth.getVerification}`);
        addLog(`- verify: ${typeof auth.verify}`);
        addLog(`- signIn: ${typeof auth.signIn}`);
        addLog(`- signUp: ${typeof auth.signUp}`);
        
      } catch (error) {
        addLog(`❌ CloudBase初始化失败: ${error}`);
      }
      
    } catch (error) {
      addLog(`❌ 检查失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSMSPermission = async () => {
    setLoading(true);
    
    try {
      addLog('📱 测试短信权限...');
      
      const auth = getAuth();
      
      // 尝试调用getVerification，但使用一个不会真正发送的测试号码
      try {
        const result = await auth.getVerification({
          phone_number: '+86 10000000000', // 测试号码
        });
        addLog('✅ getVerification方法调用成功');
        addLog(`📋 返回结果: ${JSON.stringify(result)}`);
      } catch (error: any) {
        addLog('❌ getVerification调用失败');
        addLog(`📋 错误代码: ${error.code || 'unknown'}`);
        addLog(`📋 错误消息: ${error.message || 'unknown'}`);
        addLog(`📋 HTTP状态: ${error.status || 'unknown'}`);
        addLog(`📋 完整错误: ${JSON.stringify(error, null, 2)}`);
      }
      
    } catch (error) {
      addLog(`❌ 测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">CloudBase 配置调试</h1>
          
          <div className="space-y-4 mb-6">
            <Button 
              onClick={checkCloudBaseConfig}
              disabled={loading}
              className="mr-4"
            >
              {loading ? '检查中...' : '检查CloudBase配置'}
            </Button>
            
            <Button 
              onClick={testSMSPermission}
              disabled={loading}
              variant="outline"
            >
              {loading ? '测试中...' : '测试短信权限'}
            </Button>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">点击按钮开始调试...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 检查清单：</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• CloudBase控制台 → 身份验证 → 手机号登录已开通</li>
              <li>• 短信模板和签名已审核通过</li>
              <li>• 安全域名已添加：{window.location.origin}</li>
              <li>• 短信服务余额充足</li>
              <li>• 环境ID配置正确</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}