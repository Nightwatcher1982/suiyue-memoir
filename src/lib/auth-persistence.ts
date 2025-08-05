'use client';

import type { User } from '@/types';

const USER_STORAGE_KEY = 'suiyue_user';
const USER_SESSION_KEY = 'suiyue_session_active';

export class AuthPersistence {
  private static instance: AuthPersistence;
  private listeners: ((user: User | null) => void)[] = [];

  static getInstance(): AuthPersistence {
    if (!AuthPersistence.instance) {
      AuthPersistence.instance = new AuthPersistence();
    }
    return AuthPersistence.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initStorageListener();
      this.initVisibilityListener();
    }
  }

  // 初始化存储监听器
  private initStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === USER_STORAGE_KEY) {
        const user = e.newValue ? this.parseUser(e.newValue) : null;
        this.notifyListeners(user);
      }
    });
  }

  // 初始化页面可见性监听器（用于标签页切换时同步状态）
  private initVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 页面变为可见时，重新检查用户状态
        const currentUser = this.getUser();
        this.notifyListeners(currentUser);
      }
    });
  }

  // 保存用户信息
  saveUser(user: User): void {
    try {
      const userData = JSON.stringify(user);
      localStorage.setItem(USER_STORAGE_KEY, userData);
      sessionStorage.setItem(USER_SESSION_KEY, 'true');
      
      // 触发自定义事件
      this.dispatchUserChangeEvent(user);
      
      console.log('💾 用户信息已保存:', user);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }

  // 获取用户信息
  getUser(): User | null {
    try {
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      if (!userData) return null;

      const user = this.parseUser(userData);
      
      // 检查会话是否有效
      const sessionActive = sessionStorage.getItem(USER_SESSION_KEY);
      if (!sessionActive) {
        console.log('🔄 会话已过期，重新建立会话');
        sessionStorage.setItem(USER_SESSION_KEY, 'true');
      }

      return user;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  // 清除用户信息
  clearUser(): void {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(USER_SESSION_KEY);
      
      // 触发自定义事件
      this.dispatchUserChangeEvent(null);
      
      console.log('🗑️ 用户信息已清除');
    } catch (error) {
      console.error('清除用户信息失败:', error);
    }
  }

  // 检查用户是否已登录
  isAuthenticated(): boolean {
    const user = this.getUser();
    const sessionActive = sessionStorage.getItem(USER_SESSION_KEY);
    return !!user && !!sessionActive;
  }

  // 添加状态变化监听器
  addListener(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    
    // 返回移除监听器的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知所有监听器
  private notifyListeners(user: User | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('通知监听器失败:', error);
      }
    });
  }

  // 解析用户数据
  private parseUser(userData: string): User | null {
    try {
      const user = JSON.parse(userData);
      // 验证必要字段
      if (!user.id) {
        console.warn('用户数据缺少必要字段，清除无效数据');
        this.clearUser();
        return null;
      }
      return user;
    } catch (error) {
      console.error('解析用户数据失败:', error);
      this.clearUser();
      return null;
    }
  }

  // 触发自定义用户变化事件
  private dispatchUserChangeEvent(user: User | null): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('suiyue-user-change', {
        detail: { user }
      }));
    }
  }

  // 刷新用户会话（延长会话有效期）
  refreshSession(): void {
    if (this.isAuthenticated()) {
      sessionStorage.setItem(USER_SESSION_KEY, 'true');
      console.log('🔄 用户会话已刷新');
    }
  }
}

// 导出单例实例
export const authPersistence = AuthPersistence.getInstance();