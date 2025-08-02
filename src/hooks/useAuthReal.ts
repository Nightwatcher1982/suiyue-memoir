'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/cloudbase/config';
import { databaseService } from '@/lib/cloudbase/database';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isClient: boolean;
}

interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export function useAuthReal() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isClient: false,
  });

  // 客户端检查
  useEffect(() => {
    setAuthState(prev => ({ ...prev, isClient: true }));
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    if (!authState.isClient) return;

    const auth = getAuth();
    if (!auth) {
      // 如果认证服务不可用，设置为未登录状态
      setAuthState({
        user: null,
        loading: false,
        isClient: true,
      });
      return;
    }
    
    // 检查认证服务是否有onAuthStateChanged方法
    if (typeof auth.onAuthStateChanged !== 'function') {
      console.warn('CloudBase认证服务未正确初始化，使用模拟认证');
      setAuthState({
        user: null,
        loading: false,
        isClient: true,
      });
      return;
    }
    
    const unsubscribe = auth.onAuthStateChanged(async (authUser: any) => {
      try {
        if (authUser) {
          // 用户已登录，获取用户详细信息
          let userInfo = await databaseService.getUserById(authUser.uid);
          
          if (!userInfo) {
            // 如果数据库中没有用户信息，创建新用户
            const userData = {
              phone: authUser.customUserId || '',
              nickname: authUser.nickName || '用户',
              avatar: authUser.photoURL || '',
            };
            
            try {
              await databaseService.createUser({ ...userData });
              userInfo = { id: authUser.uid, ...userData, createdAt: new Date(), updatedAt: new Date() };
            } catch (error) {
              console.error('创建用户信息失败:', error);
              // 如果创建失败，使用基本信息
              userInfo = { 
                id: authUser.uid, 
                ...userData, 
                createdAt: new Date(), 
                updatedAt: new Date() 
              };
            }
          }

          setAuthState({
            user: userInfo,
            loading: false,
            isClient: true,
          });
        } else {
          // 用户未登录
          setAuthState({
            user: null,
            loading: false,
            isClient: true,
          });
        }
      } catch (error) {
        console.error('处理认证状态变化失败:', error);
        setAuthState({
          user: null,
          loading: false,
          isClient: true,
        });
      }
    });

    return unsubscribe;
  }, [authState.isClient]);

  // 手机号登录
  const loginWithPhone = async (phone: string, code: string): Promise<LoginResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const auth = getAuth();
      if (!auth) {
        // 如果认证服务不可用，使用模拟登录
        console.warn('CloudBase认证服务不可用，使用模拟登录');
        const mockUser: User = {
          id: 'mock-user-id',
          phone,
          nickname: '测试用户',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setAuthState({
          user: mockUser,
          loading: false,
          isClient: true,
        });
        
        return { success: true, user: mockUser };
      }
      
      // 检查认证方法是否存在
      if (typeof auth.signInWithPhoneNumber !== 'function') {
        throw new Error('认证方法不可用');
      }
      
      const result = await auth.signInWithPhoneNumber(phone, code);
      
      if (result.user) {
        return { success: true, user: authState.user! };
      } else {
        return { success: false, error: '登录失败，请重试' };
      }
    } catch (error: any) {
      console.error('手机号登录失败:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { 
        success: false, 
        error: error.message || '登录失败，请检查手机号和验证码' 
      };
    }
  };

  // 发送验证码
  const sendVerificationCode = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const auth = getAuth();
      if (!auth) {
        // 如果认证服务不可用，模拟发送验证码
        console.warn('CloudBase认证服务不可用，模拟发送验证码');
        return { success: true };
      }
      
      // 检查发送验证码方法是否存在
      if (typeof auth.sendPhoneCode !== 'function') {
        throw new Error('发送验证码方法不可用');
      }
      
      await auth.sendPhoneCode(phone);
      return { success: true };
    } catch (error: any) {
      console.error('发送验证码失败:', error);
      return { 
        success: false, 
        error: error.message || '发送验证码失败，请稍后重试' 
      };
    }
  };

  // 微信登录
  const loginWithWechat = async (): Promise<LoginResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const auth = getAuth();
      if (!auth) {
        // 如果认证服务不可用，使用模拟登录
        console.warn('CloudBase认证服务不可用，使用模拟微信登录');
        const mockUser: User = {
          id: 'mock-wechat-user-id',
          wechatId: 'mock-wechat-id',
          nickname: '微信用户',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setAuthState({
          user: mockUser,
          loading: false,
          isClient: true,
        });
        
        return { success: true, user: mockUser };
      }
      
      // 检查微信登录方法是否存在
      if (typeof auth.signInWithProvider !== 'function') {
        throw new Error('微信登录方法不可用');
      }
      
      const result = await auth.signInWithProvider('wechat');
      
      if (result.user) {
        return { success: true, user: authState.user! };
      } else {
        return { success: false, error: '微信登录失败，请重试' };
      }
    } catch (error: any) {
      console.error('微信登录失败:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { 
        success: false, 
        error: error.message || '微信登录失败，请重试' 
      };
    }
  };

  // 退出登录
  const logout = async (): Promise<void> => {
    try {
      const auth = getAuth();
      if (!auth) {
        // 如果认证服务不可用，直接清除本地状态
        console.warn('CloudBase认证服务不可用，清除本地登录状态');
        setAuthState({
          user: null,
          loading: false,
          isClient: true,
        });
        return;
      }
      
      // 检查退出登录方法是否存在
      if (typeof auth.signOut !== 'function') {
        throw new Error('退出登录方法不可用');
      }
      
      await auth.signOut();
      setAuthState({
        user: null,
        loading: false,
        isClient: true,
      });
    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使退出失败，也清除本地状态
      setAuthState({
        user: null,
        loading: false,
        isClient: true,
      });
    }
  };

  // 更新用户信息
  const updateUserInfo = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!authState.user) {
      return { success: false, error: '用户未登录' };
    }

    try {
      await databaseService.updateUser(authState.user.id, updates);
      
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));
      
      return { success: true };
    } catch (error: any) {
      console.error('更新用户信息失败:', error);
      return { 
        success: false, 
        error: error.message || '更新用户信息失败' 
      };
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    isClient: authState.isClient,
    loginWithPhone,
    sendVerificationCode,
    loginWithWechat,
    logout,
    updateUserInfo,
  };
} 