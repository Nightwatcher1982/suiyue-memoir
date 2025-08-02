'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [verifyResult, setVerifyResult] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [verificationInfo, setVerificationInfo] = useState<any>(null);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      alert('请输入手机号');
      return;
    }

    setSending(true);
    setSendResult('');

    try {
      // 使用CloudBase发送短信验证码
      const { authService } = await import('@/lib/cloudbase/auth');
      const result = await authService.sendSMSCode(phoneNumber);
      setSendResult(JSON.stringify(result, null, 2));
      
      // 如果发送成功，保存验证信息并启动60秒倒计时
      if (result.success) {
        setVerificationInfo(result.verificationInfo);
        setCountdown(60);
      }
    } catch (error) {
      setSendResult(`Error: ${error}`);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!phoneNumber || !code) {
      alert('请输入手机号和验证码');
      return;
    }

    if (!verificationInfo) {
      alert('请先发送验证码');
      return;
    }

    setVerifying(true);
    setVerifyResult('');

    try {
      // 使用CloudBase验证短信验证码并登录
      const { authService } = await import('@/lib/cloudbase/auth');
      const result = await authService.signInWithPhoneCode(phoneNumber, code, verificationInfo);
      setVerifyResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('测试页面捕获错误:', error);
      setVerifyResult(`Error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setVerifying(false);
    }
  };

  // 测试CloudBase auth方法的函数
  const handleTestAuthMethods = async () => {
    try {
      const { authService } = await import('@/lib/cloudbase/auth');
      const { getAuth } = await import('@/lib/cloudbase/config');
      const auth = getAuth();
      
      console.log('🔍 CloudBase auth对象:', auth);
      
      // 检查关键方法是否可用
      const methods = {
        'getVerification': typeof auth.getVerification,
        'verify': typeof auth.verify,
        'signIn': typeof auth.signIn,
        'signUp': typeof auth.signUp,
        'currentUser': typeof auth.currentUser,
      };
      
      console.log('🔍 CloudBase v2方法检查:', methods);
      
      let result = 'CloudBase v2 方法检查结果:\n';
      Object.entries(methods).forEach(([method, type]) => {
        result += `${method}: ${type}\n`;
      });
      
      setVerifyResult(result);
    } catch (error) {
      console.error('测试auth方法失败:', error);
      setVerifyResult(`测试失败: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">📱 短信服务测试</h1>
          
          <div className="space-y-6">
            {/* 手机号输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号码
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入手机号（如：13812345678）"
              />
            </div>

            {/* 发送验证码 */}
            <div>
              <Button
                onClick={handleSendCode}
                disabled={sending || countdown > 0}
                className="w-full"
              >
                {sending ? '发送中...' : countdown > 0 ? `请等待 ${countdown}s` : '📤 发送验证码'}
              </Button>
            </div>

            {/* 发送结果 */}
            {sendResult && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发送结果
                </label>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
                  {sendResult}
                </pre>
              </div>
            )}

            {/* 验证码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证码
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入6位验证码"
                maxLength={6}
              />
            </div>

            {/* 测试CloudBase方法 */}
            <div>
              <Button
                onClick={handleTestAuthMethods}
                variant="secondary"
                className="w-full mb-2"
              >
                🔍 检查CloudBase方法
              </Button>
            </div>

            {/* 验证验证码 */}
            <div>
              <Button
                onClick={handleVerifyCode}
                disabled={verifying}
                variant="outline"
                className="w-full"
              >
                {verifying ? '验证中...' : '✅ 验证验证码'}
              </Button>
            </div>

            {/* 验证结果 */}
            {verifyResult && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  验证结果
                </label>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
                  {verifyResult}
                </pre>
              </div>
            )}
          </div>

          {/* 验证信息状态 */}
          {verificationInfo && (
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">✅ 验证信息已准备</h3>
              <p className="text-sm text-green-700">
                已获取验证信息，可以输入验证码进行登录
              </p>
            </div>
          )}

          {/* 使用说明 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">📋 CloudBase v2 SMS流程</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>步骤1</strong>: getVerification() 发送验证码，获取verification_id</li>
              <li>• <strong>步骤2</strong>: verify() 验证验证码，获取verification_token</li>
              <li>• <strong>步骤3</strong>: signIn() 使用token登录，或signUp() 注册新用户</li>
              <li>• 手机号格式: +86 13800000000（注意空格）</li>
              <li>• 自动处理新用户注册和现有用户登录</li>
            </ul>
          </div>

          {/* 返回按钮 */}
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
            >
              ← 返回工作台
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}