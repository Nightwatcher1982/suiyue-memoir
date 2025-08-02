// 用户相关类型
export interface User {
  id: string;
  phone?: string;
  wechatId?: string;
  nickname: string;
  avatar?: string;
  subscription?: 'free' | 'basic' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}

// 回忆录项目类型
export interface MemoirProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  coverStyle?: string;
  status: 'draft' | 'writing' | 'completed' | 'active';
  chapters?: Chapter[];
  progress?: number; // 0-100
  wordCount: number;
  chapterCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 章节类型
export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  photos: Photo[];
  audioRecordings: AudioRecording[];
  createdAt: Date;
  updatedAt: Date;
}

// 照片类型
export interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  uploadedAt: Date;
  
  // 用户输入的元数据
  name: string; // 照片名称
  description?: string; // 详细描述
  relatedPeople?: string[]; // 相关人物
  photographyDate?: Date; // 摄影时间
  location?: string; // 拍摄地点
  tags?: string[]; // 标签
  
  // 关联信息
  userId: string; // 所属用户
  projectId?: string; // 关联项目（可选）
  chapterId?: string; // 关联章节（可选）
  
  // 照片修复相关字段
  originalUrl?: string; // 原始照片URL
  enhancedUrl?: string; // 修复后照片URL
  quality?: {
    score: number; // 质量评分 0-100
    issues: PhotoIssue[]; // 检测到的问题
    recommendations: string[]; // 修复建议
  };
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
    colorSpace?: string;
    dpi?: number;
  };
  
  // CloudBase存储相关
  fileId?: string; // CloudBase文件ID
  storageUrl?: string; // 永久存储URL
  
  // 档案管理
  isArchived?: boolean; // 是否归档
  createdAt: Date;
  updatedAt: Date;
}

// 照片质量问题类型
export interface PhotoIssue {
  type: 'blur' | 'noise' | 'lowResolution' | 'lowContrast' | 'overexposed' | 'underexposed' | 'colorCast' | 'artifacts';
  severity: 'low' | 'medium' | 'high';
  description: string;
  confidence: number; // 0-1 置信度
}

// 照片修复选项
export interface PhotoEnhancementOptions {
  // 基础增强
  autoEnhance: boolean;
  denoising: boolean;
  sharpening: boolean;
  upscaling: boolean;
  
  // 色彩调整
  colorCorrection: boolean;
  contrastEnhancement: boolean;
  brightnessAdjustment: boolean;
  saturationBoost: boolean;
  
  // 高级功能
  oldPhotoRestoration: boolean; // 老照片修复
  scratchRemoval: boolean; // 划痕去除
  colorization: boolean; // 黑白照片上色
  faceEnhancement: boolean; // 人脸增强
  
  // 输出设置
  outputFormat: 'original' | 'jpg' | 'png' | 'webp';
  outputQuality: number; // 1-100
  maxWidth?: number;
  maxHeight?: number;
}

// 照片修复结果
export interface PhotoEnhancementResult {
  success: boolean;
  enhancedUrl?: string;
  thumbnail?: string;
  improvements: {
    type: string;
    description: string;
    beforeAfterComparison?: {
      before: string;
      after: string;
    };
  }[];
  processingTime: number; // 处理时间（秒）
  qualityScore: {
    before: number;
    after: number;
    improvement: number;
  };
  error?: string;
}

// 语音记录类型
export interface AudioRecording {
  id: string;
  url: string;
  duration: number;
  transcription?: string;
  status: 'processing' | 'completed' | 'failed';
  dialect?: string; // 方言类型
  createdAt: Date;
}

// 人物关系类型
export interface Character {
  id: string;
  projectId: string;
  name: string;
  relationship: string;
  avatar?: string;
  description?: string;
  position: { x: number; y: number };
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 订阅计划类型
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
} 