import { getAuth, getCloudbase } from './config';

export class AuthService {
  private get auth() {
    return getAuth();
  }
  
  private get app() {
    return getCloudbase();
  }

  // 获取当前用户
  async getCurrentUser() {
    try {
      const currentUser = this.auth.currentUser;
      return currentUser;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  // 匿名登录 - 支持多种CloudBase SDK版本的方法
  async signInAnonymously() {
    try {
      // 检查是否已有匿名用户
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        console.log('用户已存在:', currentUser);
        return currentUser;
      }

      console.log('开始匿名登录...');
      
      // 尝试多种可能的匿名登录方法
      let loginResult = null;
      
      if (typeof this.auth.signInAnonymously === 'function') {
        // 标准方法
        loginResult = await this.auth.signInAnonymously();
      } else if (typeof this.auth.anonymousAuthProvider === 'function') {
        // 备用方法 - 使用provider
        loginResult = await this.auth.anonymousAuthProvider().signIn();
      } else {
        throw new Error('未找到可用的匿名登录方法');
      }
      
      const result = this.auth.currentUser;
      console.log('匿名登录成功:', result);
      
      // 检查登录范围（如果支持）
      if (typeof this.auth.loginScope === 'function') {
        const loginScope = await this.auth.loginScope();
        console.log('登录范围:', loginScope);
      }
      
      return result;
    } catch (error) {
      console.error('匿名登录失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : error,
        code: (error as any)?.code,
        requestId: (error as any)?.requestId
      });
      throw error;
    }
  }

  // 检查用户是否已登录
  isAuthenticated() {
    try {
      return this.auth.currentUser !== null;
    } catch (error) {
      return false;
    }
  }

  // 确保用户已认证（自动匿名登录）
  async ensureAuthenticated() {
    if (this.isAuthenticated()) {
      return this.auth.currentUser;
    }

    try {
      return await this.signInAnonymously();
    } catch (error) {
      console.warn('自动匿名登录失败，某些功能可能受限:', error);
      return null;
    }
  }

  // 发送短信验证码 - 使用CloudBase v2正确的方法
  async sendSMSCode(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    verificationInfo?: any;
  }> {
    try {
      console.log('📱 CloudBase v2发送短信验证码到:', phoneNumber);
      
      // 格式化手机号为CloudBase v2要求的格式：+86 手机号
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('🔍 格式化后的手机号:', formattedPhone);
      
      // 使用CloudBase v2的getVerification方法发送验证码
      console.log('🔄 使用getVerification方法发送验证码...');
      const verificationResult = await this.auth.getVerification({
        phone_number: formattedPhone,
      });
      
      console.log('✅ CloudBase短信验证码发送结果:', verificationResult);
      
      // 检查返回结果
      if (verificationResult && verificationResult.verification_id) {
        return {
          success: true,
          message: '验证码发送成功，请查收短信',
          verificationInfo: verificationResult,
        };
      } else {
        throw new Error('发送验证码失败，未获取到verification_id');
      }
      
    } catch (error: any) {
      console.error('❌ CloudBase短信发送失败:', error);
      console.error('❌ 错误详细信息:', {
        message: error.message,
        code: error.code,
        status: error.status,
        response: error.response,
        stack: error.stack
      });
      
      // 处理CloudBase特定的错误
      let errorMessage = '发送验证码失败，请稍后重试';
      
      if (error.code || error.message) {
        // 处理CloudBase特定错误信息
        const message = error.message || '';
        
        if (message.includes('up to 1 text message per minute')) {
          errorMessage = '发送过于频繁，请等待1分钟后重试';
        } else if (message.includes('invalid')) {
          errorMessage = '手机号格式不正确';
        } else if (error.status === 403) {
          errorMessage = '权限被拒绝：请检查CloudBase短信服务配置和域名白名单';
        } else {
          switch (error.code) {
            case 'INVALID_PARAM':
              errorMessage = '手机号格式不正确';
              break;
            case 'OPERATION_FAIL':
              errorMessage = '发送失败，请检查手机号是否正确';
              break;
            case 'QUOTA_EXCEEDED':
              errorMessage = '发送过于频繁，请稍后再试';
              break;
            case 'PERMISSION_DENIED':
            case 'FORBIDDEN':
              errorMessage = '权限不足：请检查CloudBase短信服务是否已开通';
              break;
            default:
              errorMessage = error.message || errorMessage;
          }
        }
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // 使用手机验证码登录 - 使用CloudBase v2正确的方法
  async signInWithPhoneCode(phoneNumber: string, code: string, verificationInfo?: any): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    try {
      console.log('📱 CloudBase v2手机验证码登录:', phoneNumber);
      console.log('🔍 验证码:', code);
      console.log('🔍 验证信息:', verificationInfo);
      
      if (!verificationInfo || !verificationInfo.verification_id) {
        throw new Error('缺少验证信息，请先发送验证码');
      }
      
      // 格式化手机号
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('🔍 格式化后的手机号:', formattedPhone);
      
      // 步骤1: 验证验证码
      console.log('🔄 步骤1: 验证验证码...');
      const verifyResult = await this.auth.verify({
        verification_id: verificationInfo.verification_id,
        verification_code: code,
      });
      
      console.log('✅ 验证码验证结果:', verifyResult);
      
      if (!verifyResult || !verifyResult.verification_token) {
        throw new Error('验证码验证失败，未获取到verification_token');
      }
      
      // 步骤2: 尝试使用token登录现有用户
      console.log('🔄 步骤2: 尝试登录现有用户...');
      try {
        const loginResult = await this.auth.signIn({
          username: formattedPhone,
          verification_token: verifyResult.verification_token,
        });
        
        console.log('✅ CloudBase登录成功:', loginResult);
        const currentUser = this.auth.currentUser;
        
        return {
          success: true,
          message: '登录成功',
          user: currentUser,
        };
      } catch (loginError: any) {
        console.log('🔄 登录失败，可能是新用户，尝试注册...', loginError);
        
        // 步骤3: 如果登录失败，注册新用户
        if (loginError.code === 'USER_NOT_FOUND' || 
            loginError.error === 'not_found' ||
            loginError.error_description?.includes('User not exist') ||
            loginError.message?.includes('User not exist') ||
            loginError.message?.includes('not found')) {
          
          console.log('🔄 步骤3: 注册新用户...');
          console.log('🔍 注册参数:', {
            phone_number: formattedPhone,
            verification_code: code,
            verification_token: verifyResult.verification_token,
          });
          
          try {
            const registerResult = await this.auth.signUp({
              phone_number: formattedPhone,
              verification_code: code,
              verification_token: verifyResult.verification_token,
            });
            
            console.log('✅ CloudBase注册成功:', registerResult);
            
            // 注册成功后检查用户状态
            const currentUser = this.auth.currentUser;
            console.log('🔍 注册后用户状态:', currentUser);
            
            return {
              success: true,
              message: '注册并登录成功',
              user: currentUser,
            };
          } catch (registerError: any) {
            console.error('❌ 注册失败:', registerError);
            console.error('❌ 注册错误详情:', JSON.stringify(registerError, null, 2));
            throw registerError;
          }
        } else {
          throw loginError;
        }
      }
      
    } catch (error: any) {
      console.error('❌ CloudBase手机认证失败:', error);
      console.error('❌ 错误详情:', JSON.stringify(error, null, 2));
      
      let errorMessage = '认证失败，请重试';
      
      if (error.code || error.message || error.error_description) {
        const message = error.message || error.error_description || '';
        
        if (message.includes('INVALID_CODE') || message.includes('verification code')) {
          errorMessage = '验证码错误或已过期';
        } else if (message.includes('INVALID_PARAM')) {
          errorMessage = '手机号或验证码格式不正确';
        } else if (message.includes('User not exist')) {
          errorMessage = '用户不存在，注册失败';
        } else {
          switch (error.code) {
            case 'INVALID_PARAM':
              errorMessage = '手机号或验证码格式不正确';
              break;
            case 'INVALID_CODE':
              errorMessage = '验证码错误或已过期';
              break;
            case 'USER_NOT_FOUND':
              errorMessage = '用户不存在';
              break;
            default:
              errorMessage = error.message || error.error_description || errorMessage;
          }
        }
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }


  // 验证并格式化手机号码为CloudBase v2要求的格式
  private formatPhoneNumber(phoneNumber: string): string {
    // 移除所有非数字字符
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // 验证11位中国手机号
    if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      // CloudBase v2需要+86格式（带空格）
      return `+86 ${cleanPhone}`;
    }
    
    // 如果已经是10位数字，说明可能已经去掉了开头的1
    if (cleanPhone.length === 10) {
      return `+86 1${cleanPhone}`;
    }
    
    throw new Error('请输入有效的11位中国手机号');
  }

  // 验证手机号格式
  static isValidChinesePhoneNumber(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    // 中国手机号格式：11位数字，以1开头
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(cleanPhone.slice(-11));
  }

  // 登出
  async signOut() {
    try {
      await this.auth.signOut();
      console.log('用户已登出');
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const authService = new AuthService();