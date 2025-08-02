'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getCloudbase } from '@/lib/cloudbase/config';

export function CloudBaseDebugger() {
  const [debugResult, setDebugResult] = useState<string>('');
  const [debugging, setDebugging] = useState(false);

  const runDebugCheck = async () => {
    setDebugging(true);
    setDebugResult('🔧 开始CloudBase深度诊断...\n\n');
    
    try {
      // 1. 基本检查
      setDebugResult(prev => prev + '1️⃣ 基本检查:\n');
      setDebugResult(prev => prev + `• 环境ID: ${process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID}\n`);
      setDebugResult(prev => prev + `• 当前域名: ${window.location.origin}\n\n`);
      
      // 2. CloudBase实例
      const app = getCloudbase();
      setDebugResult(prev => prev + '2️⃣ CloudBase实例: OK\n');
      
      // 3. Auth服务检查
      const auth = app.auth();
      setDebugResult(prev => prev + '3️⃣ Auth服务: OK\n\n');
      
      // 4. 检查可用的认证方法
      setDebugResult(prev => prev + '4️⃣ 检查Auth方法:\n');
      const authMethods = Object.getOwnPropertyNames(auth).filter(name => typeof auth[name] === 'function');
      setDebugResult(prev => prev + `• 可用方法: ${authMethods.join(', ')}\n\n`);
      
      // 5. 尝试找到匿名登录方法  
      setDebugResult(prev => prev + '5️⃣ 匿名登录方法检查:\n');
      const possibleMethods = ['signInAnonymously', 'anonymousSignIn', 'anonymousLogin', 'loginAnonymously'];
      let foundMethod = null;
      
      for (const method of possibleMethods) {
        if (typeof auth[method] === 'function') {
          foundMethod = method;
          setDebugResult(prev => prev + `• 找到方法: ${method} ✅\n`);
          break;
        } else {
          setDebugResult(prev => prev + `• ${method}: 不存在 ❌\n`);
        }
      }
      
      // 检查是否有anonymousAuthProvider方法
      if (!foundMethod && typeof auth.anonymousAuthProvider === 'function') {
        setDebugResult(prev => prev + '• 找到anonymousAuthProvider方法 ✅\n');
        foundMethod = 'anonymousAuthProvider';
      }
      
      if (foundMethod) {
        setDebugResult(prev => prev + `\n• 尝试使用 ${foundMethod}...\n`);
        try {
          if (foundMethod === 'anonymousAuthProvider') {
            await auth.anonymousAuthProvider().signIn();
          } else {
            await auth[foundMethod]();
          }
          
          const user = auth.currentUser;
          if (user) {
            setDebugResult(prev => prev + `• 匿名登录成功! 用户ID: ${user.uid || user.openid || 'N/A'}\n`);
            
            // 检查登录范围
            if (typeof auth.loginScope === 'function') {
              const loginScope = await auth.loginScope();
              setDebugResult(prev => prev + `• 登录范围: ${loginScope}\n`);
            }
          } else {
            setDebugResult(prev => prev + '• 登录方法执行成功，但未获取到用户对象\n');
          }
        } catch (loginError) {
          setDebugResult(prev => prev + `• 登录失败: ${loginError instanceof Error ? loginError.message : loginError}\n`);
        }
      } else {
        setDebugResult(prev => prev + '• 未找到匿名登录方法 ❌\n');
      }
      
      setDebugResult(prev => prev + '\n✅ 诊断完成\n');
      
    } catch (error) {
      setDebugResult(prev => prev + `\n❌ 诊断过程出错: ${error instanceof Error ? error.message : error}\n`);
      console.error('CloudBase调试失败:', error);
    } finally {
      setDebugging(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">🔧 CloudBase深度诊断</h3>
      
      <div className="space-y-4">
        <Button 
          onClick={runDebugCheck}
          disabled={debugging}
          className="w-full"
        >
          {debugging ? '诊断中...' : '开始深度诊断'}
        </Button>
        
        {debugResult && (
          <div className="p-4 bg-black text-green-400 rounded-lg font-mono text-sm">
            <pre className="whitespace-pre-wrap">{debugResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}