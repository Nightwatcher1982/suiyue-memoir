'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/types';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<any>(null); // 保存验证信息

  useEffect(() => {
    // 标记为客户端环境
    setIsClient(true);
    
    // 检查认证状态 - 结合本地存储和CloudBase认证
    const checkAuthState = async () => {
      try {
        // 首先检查本地存储
        const savedUser = localStorage.getItem('suiyue_user');
        let localUser = null;
        if (savedUser) {
          localUser = JSON.parse(savedUser);
        }
        
        // 如果有本地用户，尝试确保CloudBase也已认证
        if (localUser) {
          try {
            const { authService } = await import('@/lib/cloudbase/auth');
            await authService.ensureAuthenticated();
            setUser(localUser);
            console.log('✅ 用户认证状态已同步');
          } catch (error) {
            console.warn('CloudBase认证失败，但本地用户存在:', error);
            setUser(localUser); // 仍然设置本地用户
          }
        }
      } catch (error) {
        console.error('获取认证状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
    
    // 初始化CloudBase
    import('@/lib/cloudbase/init').then(({ initializeCloudBase }) => {
      initializeCloudBase().then(success => {
        if (success) {
          console.log('🎉 CloudBase环境就绪！');
        } else {
          console.warn('⚠️  CloudBase环境初始化失败，请检查配置');
        }
      });
    });
  }, []);

  const sendSmsCode = async (phone: string): Promise<boolean> => {
    try {
      console.log('📱 使用CloudBase v2发送短信验证码到:', phone);
      
      // 验证手机号格式
      const { authService, AuthService } = await import('@/lib/cloudbase/auth');
      if (!AuthService.isValidChinesePhoneNumber(phone)) {
        alert('请输入有效的中国手机号');
        return false;
      }
      
      const result = await authService.sendSMSCode(phone);
      
      if (result.success) {
        // 保存验证信息供后续登录使用
        setVerificationInfo(result.verificationInfo);
        console.log('✅ CloudBase v2短信验证码发送成功，verificationInfo已保存');
        return true;
      } else {
        console.error('❌ CloudBase短信发送失败:', result.message);
        alert(result.message);
        return false;
      }
    } catch (error) {
      console.error('发送短信验证码失败:', error);
      alert('发送验证码失败，请检查网络连接');
      return false;
    }
  };

  const login = async (phone: string, code: string): Promise<boolean> => {
    try {
      console.log('📱 使用CloudBase v2手机验证码登录:', phone, code);
      
      // 使用CloudBase v2进行手机验证码登录，传入之前保存的verificationInfo
      const { authService } = await import('@/lib/cloudbase/auth');
      const loginResult = await authService.signInWithPhoneCode(phone, code, verificationInfo);
      
      if (!loginResult.success) {
        console.error('❌ CloudBase登录失败:', loginResult.message);
        alert(loginResult.message);
        return false;
      }

      console.log('✅ CloudBase v2登录成功:', loginResult.user);

      // 基于CloudBase用户信息创建本地用户对象
      const cloudbaseUser = loginResult.user;
      const newUser: User = {
        id: cloudbaseUser.uid || 'user_' + crypto.randomUUID(),
        phone,
        nickname: cloudbaseUser.customUserId || `用户${phone.slice(-4)}`,
        avatar: cloudbaseUser.avatarUrl || '',
        subscription: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 保存到本地存储
      if (isClient) {
        localStorage.setItem('suiyue_user', JSON.stringify(newUser));
      }
      
      setUser(newUser);
      // 清除验证信息
      setVerificationInfo(null);
      console.log('🎉 登录成功:', newUser);
      return true;

    } catch (error) {
      console.error('手机登录失败:', error);
      alert('登录失败，请重试');
      return false;
    }
  };

  const loginWithWechat = async (): Promise<boolean> => {
    try {
      // TODO: 集成CloudBase微信登录
      console.log('微信登录');
      
      // 先确保CloudBase匿名认证
      try {
        const { authService } = await import('@/lib/cloudbase/auth');
        await authService.ensureAuthenticated();
        console.log('✅ CloudBase认证成功');
      } catch (error) {
        console.warn('CloudBase认证失败，但继续使用本地认证:', error);
      }
      
      const newUser: User = {
        id: 'wechat_user_' + crypto.randomUUID(),
        wechatId: 'wx_' + crypto.randomUUID(),
        nickname: '微信用户',
        avatar: '',
        subscription: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 保存到本地存储
      if (isClient) {
        localStorage.setItem('suiyue_user', JSON.stringify(newUser));
      }
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('微信登录失败:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // TODO: 调用CloudBase登出API
      if (isClient) {
        localStorage.removeItem('suiyue_user');
      }
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return {
    user,
    loading: loading || !isClient, // 在客户端渲染完成前保持loading状态
    login,
    loginWithWechat,
    logout,
    sendSmsCode,
  };
} 