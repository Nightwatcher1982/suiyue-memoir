'use client';

import { useState, useEffect } from 'react';
import { authPersistence } from '@/lib/auth-persistence';
import type { User } from '@/types';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<any>(null); // 保存验证信息

  useEffect(() => {
    // 标记为客户端环境
    setIsClient(true);
    
    // 使用持久化系统检查认证状态
    const checkAuthState = async () => {
      try {
        const localUser = authPersistence.getUser();
        
        if (localUser) {
          try {
            const { authService } = await import('@/lib/cloudbase/auth');
            
            // 首先检查CloudBase是否已认证
            const isCloudBaseAuth = authService.isAuthenticated();
            console.log('🔍 CloudBase认证状态:', isCloudBaseAuth);
            
            if (!isCloudBaseAuth) {
              console.log('🔄 CloudBase未认证，尝试恢复认证状态...');
              // 尝试恢复认证状态（匿名登录作为后备）
              await authService.ensureAuthenticated();
            }
            
            setUser(localUser);
            console.log('✅ 用户认证状态已同步:', localUser);
          } catch (error) {
            console.warn('CloudBase认证失败，但本地用户存在:', error);
            // 如果CloudBase认证完全失败，清除本地用户状态
            console.warn('⚠️ 由于CloudBase认证失败，清除本地用户状态');
            authPersistence.clearUser();
            setUser(null);
          }
        } else {
          console.log('📝 没有本地用户数据');
          setUser(null);
        }
      } catch (error) {
        console.error('获取认证状态失败:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
    
    // 监听用户状态变化
    const removeListener = authPersistence.addListener((newUser) => {
      console.log('📨 用户状态变化监听:', newUser);
      setUser(newUser);
    });
    
    // 监听自定义用户变化事件
    const handleUserChange = (event: CustomEvent) => {
      const { user: newUser } = event.detail;
      console.log('🔔 收到用户变化事件:', newUser);
      setUser(newUser);
    };

    window.addEventListener('suiyue-user-change', handleUserChange as EventListener);
    
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

    // 清理函数
    return () => {
      removeListener();
      window.removeEventListener('suiyue-user-change', handleUserChange as EventListener);
    };
  }, []);

  const sendSmsCode = async (phone: string): Promise<boolean> => {
    try {
      console.log('📱 首页发送短信验证码到:', phone);
      console.log('🔍 当前页面域名:', typeof window !== 'undefined' ? window.location.origin : 'unknown');
      
      // 验证手机号格式
      const { authService, AuthService } = await import('@/lib/cloudbase/auth');
      if (!AuthService.isValidChinesePhoneNumber(phone)) {
        alert('请输入有效的中国手机号');
        return false;
      }
      
      console.log('🔄 调用authService.sendSMSCode...');
      const result = await authService.sendSMSCode(phone);
      console.log('📋 发送结果:', result);
      
      if (result.success) {
        // 保存验证信息供后续登录使用
        setVerificationInfo(result.verificationInfo);
        console.log('✅ CloudBase v2短信验证码发送成功，verificationInfo已保存:', result.verificationInfo);
        return true;
      } else {
        console.error('❌ CloudBase短信发送失败:', result.message);
        alert(result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ 首页发送短信验证码异常:', error);
      console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
      alert('发送验证码失败，请检查网络连接');
      return false;
    }
  };

  const login = async (phone: string, code: string): Promise<boolean> => {
    try {
      console.log('📱 首页手机验证码登录:', phone, code);
      console.log('🔍 使用的verificationInfo:', verificationInfo);
      
      // 使用CloudBase v2进行手机验证码登录，传入之前保存的verificationInfo
      const { authService } = await import('@/lib/cloudbase/auth');
      console.log('🔄 调用authService.signInWithPhoneCode...');
      const loginResult = await authService.signInWithPhoneCode(phone, code, verificationInfo);
      console.log('📋 登录结果:', loginResult);
      
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
      
      // 使用持久化系统保存用户信息
      authPersistence.saveUser(newUser);
      setUser(newUser);
      
      // 清除验证信息
      setVerificationInfo(null);
      console.log('🎉 登录成功:', newUser);
      
      // 使用Promise确保状态更新完成
      await new Promise(resolve => {
        setTimeout(() => {
          console.log('🔄 状态更新完成，用户信息:', newUser);
          resolve(true);
        }, 50);
      });
      
      return true;

    } catch (error) {
      console.error('❌ 首页手机登录异常:', error);
      console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
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
      
      // 使用持久化系统保存用户信息
      authPersistence.saveUser(newUser);
      setUser(newUser);
      
      console.log('🎉 微信登录成功:', newUser);
      return true;
    } catch (error) {
      console.error('微信登录失败:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 开始登出...');
      
      // 调用CloudBase登出API
      try {
        const { authService } = await import('@/lib/cloudbase/auth');
        await authService.logout();
        console.log('✅ CloudBase登出成功');
      } catch (error) {
        console.warn('CloudBase登出失败，但继续清理本地状态:', error);
      }
      
      // 使用持久化系统清理用户信息
      authPersistence.clearUser();
      
      // 清理状态
      setUser(null);
      setVerificationInfo(null);
      
      console.log('✅ 登出完成');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使失败也要清理本地状态
      authPersistence.clearUser();
      setUser(null);
      setVerificationInfo(null);
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