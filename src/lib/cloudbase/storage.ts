import { getStorage } from './config';
import { authService } from './auth';

export class StorageService {
  private get storage() {
    if (typeof window === 'undefined') {
      throw new Error('StorageService只能在客户端使用');
    }
    return getStorage();
  }

  // 上传图片文件
  async uploadPhoto(file: File, userId: string, chapterId?: string): Promise<{
    fileId: string;
    downloadUrl: string;
    fileName: string;
    fileSize: number;
  }> {
    // 确保用户已认证（如果存储规则需要认证）
    await authService.ensureAuthenticated();
    
    const cloudPath = `photos/${userId}/${chapterId || 'general'}/${Date.now()}_${file.name}`;
    
    try {
      // 检查文件大小 (最大10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件大小不能超过10MB');
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('不支持的文件格式，请上传JPG、PNG、GIF或WebP格式的图片');
      }

      // 上传文件 - 使用新的API
      const result = await this.storage.uploadFile({
        cloudPath,
        filePath: file,
      });
      
      // 获取临时下载URL - 使用新的API
      const urlResult = await this.storage.getTempFileURL({
        fileList: [result.fileID]
      });
      
      let downloadUrl = '';
      if (urlResult.fileList && urlResult.fileList.length > 0) {
        const fileItem = urlResult.fileList[0];
        if (fileItem.code === 'SUCCESS') {
          downloadUrl = fileItem.tempFileURL;
        }
      }
      
      return {
        fileId: result.fileID,
        downloadUrl,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      console.error('图片上传失败:', error);
      throw new Error(`图片上传失败: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 上传音频文件
  async uploadAudio(audioBlob: Blob, userId: string, chapterId?: string): Promise<{
    fileId: string;
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    duration?: number;
  }> {
    // 确保用户已认证（如果存储规则需要认证）
    await authService.ensureAuthenticated();
    
    const fileName = `audio/${userId}/${chapterId || 'general'}/${Date.now()}.webm`;
    
    try {
      // 检查文件大小 (最大50MB)
      if (audioBlob.size > 50 * 1024 * 1024) {
        throw new Error('音频文件大小不能超过50MB');
      }

      // 转换为File对象以便上传
      const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' });

      // 上传文件 - 使用新的API
      const result = await this.storage.uploadFile({
        cloudPath: fileName,
        filePath: audioFile,
      });
      
      // 获取临时下载URL - 使用新的API
      const urlResult = await this.storage.getTempFileURL({
        fileList: [result.fileID]
      });
      
      let downloadUrl = '';
      if (urlResult.fileList && urlResult.fileList.length > 0) {
        const fileItem = urlResult.fileList[0];
        if (fileItem.code === 'SUCCESS') {
          downloadUrl = fileItem.tempFileURL;
        }
      }
      
      return {
        fileId: result.fileID,
        downloadUrl,
        fileName,
        fileSize: audioBlob.size,
      };
    } catch (error) {
      console.error('音频上传失败:', error);
      throw new Error(`音频上传失败: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 删除文件
  async deleteFile(fileId: string): Promise<void> {
    try {
      const result = await this.storage.deleteFile({
        fileList: [fileId]
      });
      
      // 检查删除结果
      if (result.fileList && result.fileList.length > 0) {
        const fileItem = result.fileList[0];
        if (fileItem.code !== 'SUCCESS') {
          throw new Error(`删除失败: ${fileItem.code}`);
        }
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      throw new Error(`删除文件失败: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 批量删除文件
  async deleteFiles(fileIds: string[]): Promise<void> {
    try {
      if (fileIds.length === 0) return;
      
      // CloudBase支持批量删除，但建议分批处理
      const batchSize = 10;
      for (let i = 0; i < fileIds.length; i += batchSize) {
        const batch = fileIds.slice(i, i + batchSize);
        const result = await this.storage.deleteFile({
          fileList: batch
        });
        
        // 检查每个文件的删除结果
        if (result.fileList) {
          result.fileList.forEach((fileItem: any) => {
            if (fileItem.code !== 'SUCCESS') {
              console.warn(`文件删除失败: ${fileItem.fileID}, 错误: ${fileItem.code}`);
            }
          });
        }
      }
    } catch (error) {
      console.error('批量删除文件失败:', error);
      throw new Error(`批量删除文件失败: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 获取文件下载URL (用于临时链接)
  async getDownloadUrl(fileId: string): Promise<string> {
    try {
      const urlResult = await this.storage.getTempFileURL({
        fileList: [fileId]
      });
      
      if (urlResult.fileList && urlResult.fileList.length > 0) {
        const fileItem = urlResult.fileList[0];
        if (fileItem.code === 'SUCCESS') {
          return fileItem.tempFileURL;
        } else {
          throw new Error(`获取URL失败: ${fileItem.code}`);
        }
      }
      
      throw new Error('未返回文件URL');
    } catch (error) {
      console.error('获取下载链接失败:', error);
      throw new Error(`获取下载链接失败: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 注意：CloudBase v2 API已移除getUploadMetadata方法
  // 如需大文件上传，请直接使用uploadFile方法

  // 压缩图片 (客户端压缩)
  async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // 计算压缩后的尺寸
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          // 绘制压缩后的图片
          ctx?.drawImage(img, 0, 0, width, height);

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('图片压缩失败'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // 生成缩略图
  async generateThumbnail(file: File, width: number = 200, height: number = 200): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          canvas.width = width;
          canvas.height = height;

          // 计算裁剪区域 (居中裁剪)
          const sourceAspect = img.width / img.height;
          const targetAspect = width / height;

          let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

          if (sourceAspect > targetAspect) {
            // 原图更宽，裁剪左右
            sourceWidth = img.height * targetAspect;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            // 原图更高，裁剪上下
            sourceHeight = img.width / targetAspect;
            sourceY = (img.height - sourceHeight) / 2;
          }

          // 绘制缩略图
          ctx?.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(thumbnailFile);
              } else {
                reject(new Error('缩略图生成失败'));
              }
            },
            'image/jpeg',
            0.8
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// 创建单例实例
export const storageService = new StorageService(); 