import { clsx, type ClassValue } from 'clsx';

// 合并CSS类名
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 格式化日期
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short') {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('zh-CN');
  }
  
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 生成唯一ID
export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 文件大小格式化
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 音频时长格式化
export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 