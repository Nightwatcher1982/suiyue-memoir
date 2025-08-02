'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { login, loginWithWechat, sendSmsCode, loading } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号码');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const result = await sendSmsCode(phone);
      if (result) {
        setStep('code');
        setCountdown(60);
        
        // 开始倒计时
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError('发送验证码失败，请重试');
      }
    } catch {
      setError('发送验证码失败，请检查网络连接');
    } finally {
      setSendingCode(false);
    }
  };

  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setError('');
    
    try {
      const result = await login(phone, code);
      if (result) {
        onClose();
        onSuccess?.();
        // 重置表单
        setStep('phone');
        setPhone('');
        setCode('');
        setError('');
      } else {
        setError('登录失败，请检查验证码');
      }
    } catch {
      setError('登录失败，请重试');
    }
  };

  // 微信登录
  const handleWechatLogin = async () => {
    setError('');
    
    try {
      const result = await loginWithWechat();
      if (result) {
        onClose();
        onSuccess?.();
      } else {
        setError('微信登录失败，请重试');
      }
    } catch {
      setError('微信登录失败，请重试');
    }
  };

  // 重置表单
  const handleBack = () => {
    setStep('phone');
    setCode('');
    setError('');
  };

  // 测试模式快速登录
  const handleTestLogin = async () => {
    setPhone('13800138000');
    setCode('123456');
    setError('');
    
    try {
      const result = await login('13800138000', '123456');
      if (result) {
        onClose();
        setStep('phone');
        setPhone('');
        setCode('');
        setError('');
      } else {
        setError('登录失败，请重试');
      }
    } catch {
      setError('CloudBase认证暂未配置，使用测试模式');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 'phone' ? '手机号登录' : '输入验证码'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号码
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号码"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={11}
              />
            </div>

            <Button
              onClick={handleSendCode}
              disabled={sendingCode || phone.length !== 11}
              className="w-full"
            >
              {sendingCode ? '发送中...' : '发送验证码'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleWechatLogin}
              disabled={loading}
              className="w-full"
            >
              <span className="mr-2">📱</span>
              微信登录
            </Button>

            <div className="pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleTestLogin}
                className="w-full text-sm"
                size="sm"
              >
                🧪 测试快速登录 (开发模式)
              </Button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                测试账号：13800138000，验证码：123456
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                验证码
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入6位验证码"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                验证码已发送至 {phone}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                返回
              </Button>
              <Button
                onClick={handlePhoneLogin}
                disabled={loading || code.length !== 6}
                className="flex-1"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </div>

            <div className="text-center">
              {countdown > 0 ? (
                <span className="text-sm text-gray-500">
                  {countdown}秒后可重新发送
                </span>
              ) : (
                <button
                  onClick={handleSendCode}
                  disabled={sendingCode}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  重新发送验证码
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 