import { getDatabase } from './config';
import type { User, MemoirProject, Chapter, Photo, AudioRecording } from '@/types';
import { authService } from './auth';

export class DatabaseService {
  private get db() {
    if (typeof window === 'undefined') {
      return null;
    }
    return getDatabase();
  }

  // 用户相关操作
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (!this.db) {
        throw new Error('数据库服务不可用');
      }
      const result = await this.db.collection('users').add({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return result.id;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw new Error(`创建用户失败: ${error}`);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await this.db.collection('users').doc(userId).get();
      return result.data ? (result.data as User) : null;
    } catch (error) {
      console.error('获取用户失败:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('更新用户失败:', error);
      throw new Error(`更新用户失败: ${error}`);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).remove();
    } catch (error) {
      console.error('删除用户失败:', error);
      throw new Error(`删除用户失败: ${error}`);
    }
  }

  // 项目相关操作
  async createProject(projectData: Omit<MemoirProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🔐 数据库服务：开始认证检查...');
      // 确保用户已认证
      await authService.ensureAuthenticated();
      console.log('✅ 数据库服务：认证成功');
      
      // 生成唯一ID
      const { generateId } = await import('../utils');
      const projectId = generateId();
      console.log('🆔 数据库服务：生成项目ID:', projectId);
      
      const projectWithId = {
        id: projectId,
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('📝 数据库服务：准备写入数据:', projectWithId);
      
      // 使用自定义ID作为文档ID
      await this.db.collection('memoirProjects').doc(projectId).set(projectWithId);
      console.log('✅ 数据库服务：写入成功, 项目ID:', projectId);
      
      return projectId;
    } catch (error) {
      console.error('❌ 数据库服务：创建项目失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : error,
        code: (error as any)?.code,
        requestId: (error as any)?.requestId
      });
      throw new Error(`创建项目失败: ${error}`);
    }
  }

  async getUserProjects(userId: string): Promise<MemoirProject[]> {
    try {
      if (!this.db) {
        console.warn('数据库服务不可用，返回空项目列表');
        return [];
      }
      
      // 确保用户已认证
      await authService.ensureAuthenticated();
      
      console.log('📋 查询用户项目，userId:', userId);
      const result = await this.db.collection('memoirProjects')
        .where({ userId: userId })
        .orderBy('updatedAt', 'desc')
        .get();
      
      console.log('📋 数据库查询结果:', result);
      console.log('📋 查询结果类型:', typeof result, '数据类型:', Array.isArray(result?.data) ? 'array' : typeof result?.data);
      
      if (!result) {
        console.warn('查询结果为null，返回空数组');
        return [];
      }
      
      if (!result.data) {
        console.warn('查询结果.data为null，返回空数组');
        return [];
      }
      
      // 确保每个项目都有正确的ID
      const projects = result.data.map((item: any) => ({
        ...item,
        id: item._id || item.id, // CloudBase中文档ID存储在_id字段
      })) as MemoirProject[];
      
      console.log('📋 项目数据处理后:', projects);
      return projects;
    } catch (error) {
      console.error('获取用户项目失败:', error);
      return [];
    }
  }

  async getProjectById(projectId: string): Promise<MemoirProject | null> {
    try {
      const result = await this.db.collection('memoirProjects').doc(projectId).get();
      if (result.data) {
        return {
          ...result.data,
          id: result.data._id || result.data.id || projectId, // 确保ID正确设置
        } as MemoirProject;
      }
      return null;
    } catch (error) {
      console.error('获取项目失败:', error);
      return null;
    }
  }

  async updateProject(projectId: string, updates: Partial<MemoirProject>): Promise<void> {
    try {
      await this.db.collection('memoirProjects').doc(projectId).update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('更新项目失败:', error);
      throw new Error(`更新项目失败: ${error}`);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      // 删除相关章节
      const chapters = await this.getProjectChapters(projectId);
      for (const chapter of chapters) {
        await this.deleteChapter(chapter.id);
      }
      
      // 删除项目
      await this.db.collection('memoirProjects').doc(projectId).remove();
    } catch (error) {
      console.error('删除项目失败:', error);
      throw new Error(`删除项目失败: ${error}`);
    }
  }

  // 章节相关操作
  async createChapter(chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (!this.db) {
        throw new Error('数据库服务不可用');
      }
      
      // 确保用户已认证
      await authService.ensureAuthenticated();
      
      console.log('📝 开始创建章节:', chapterData);
      const result = await this.db.collection('chapters').add({
        ...chapterData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ 章节创建成功，ID:', result.id);
      return result.id;
    } catch (error) {
      console.error('❌ 创建章节失败:', error);
      throw new Error(`创建章节失败: ${error}`);
    }
  }

  async getProjectChapters(projectId: string): Promise<Chapter[]> {
    try {
      if (!this.db) {
        console.warn('数据库服务不可用，返回空章节列表');
        return [];
      }
      
      console.log('📖 查询项目章节，projectId:', projectId);
      const result = await this.db.collection('chapters')
        .where({ projectId: projectId })
        .orderBy('order', 'asc')
        .get();
      
      console.log('📖 章节查询结果:', result);
      
      if (!result || !result.data) {
        console.warn('章节查询结果为null或data为null，返回空数组');
        return [];
      }
      
      if (!Array.isArray(result.data)) {
        console.warn('章节查询结果data不是数组:', typeof result.data, result.data);
        return [];
      }
      
      // 确保每个章节都有正确的ID
      const chapters = result.data.map((item: any) => ({
        ...item,
        id: item._id || item.id, // CloudBase中文档ID存储在_id字段
      })) as Chapter[];
      
      console.log('📖 章节数据处理后:', chapters);
      return chapters;
    } catch (error) {
      console.error('获取项目章节失败:', error);
      return [];
    }
  }

  async getChapterById(chapterId: string): Promise<Chapter | null> {
    try {
      const result = await this.db.collection('chapters').doc(chapterId).get();
      if (result.data) {
        return {
          ...result.data,
          id: result.data._id || result.data.id || chapterId, // 确保ID正确设置
        } as Chapter;
      }
      return null;
    } catch (error) {
      console.error('获取章节失败:', error);
      return null;
    }
  }

  async updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('数据库服务不可用');
      }
      
      // 确保用户已认证
      await authService.ensureAuthenticated();
      
      console.log('📝 开始更新章节:', chapterId, updates);
      await this.db.collection('chapters').doc(chapterId).update({
        ...updates,
        updatedAt: new Date(),
      });
      console.log('✅ 章节更新成功:', chapterId);
    } catch (error) {
      console.error('❌ 更新章节失败:', error);
      throw new Error(`更新章节失败: ${error}`);
    }
  }

  async deleteChapter(chapterId: string): Promise<void> {
    try {
      await this.db.collection('chapters').doc(chapterId).remove();
    } catch (error) {
      console.error('删除章节失败:', error);
      throw new Error(`删除章节失败: ${error}`);
    }
  }

  // 图片相关操作
  async createPhoto(photoData: Omit<Photo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const result = await this.db.collection('photos').add({
        ...photoData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return result.id;
    } catch (error) {
      console.error('创建图片记录失败:', error);
      throw new Error(`创建图片记录失败: ${error}`);
    }
  }

  async getChapterPhotos(chapterId: string): Promise<Photo[]> {
    try {
      const result = await this.db.collection('photos')
        .where({ chapterId: chapterId })
        .orderBy('createdAt', 'desc')
        .get();
      
      // 确保每个照片都有正确的ID
      const photos = result.data.map((item: any) => ({
        ...item,
        id: item._id || item.id,
      })) as Photo[];
      
      return photos;
    } catch (error) {
      console.error('获取章节图片失败:', error);
      return [];
    }
  }

  async getUserPhotos(userId: string): Promise<Photo[]> {
    try {
      const result = await this.db.collection('photos')
        .where({ userId: userId })
        .orderBy('createdAt', 'desc')
        .get();
      
      // 确保每个照片都有正确的ID
      const photos = result.data.map((item: any) => ({
        ...item,
        id: item._id || item.id,
      })) as Photo[];
      
      return photos;
    } catch (error) {
      console.error('获取用户图片失败:', error);
      return [];
    }
  }

  async getProjectPhotos(projectId: string): Promise<Photo[]> {
    try {
      const result = await this.db.collection('photos')
        .where({ projectId: projectId })
        .orderBy('createdAt', 'desc')
        .get();
      
      // 确保每个照片都有正确的ID
      const photos = result.data.map((item: any) => ({
        ...item,
        id: item._id || item.id,
      })) as Photo[];
      
      return photos;
    } catch (error) {
      console.error('获取项目图片失败:', error);
      return [];
    }
  }

  async updatePhoto(photoId: string, updates: Partial<Photo>): Promise<void> {
    try {
      await this.db.collection('photos').doc(photoId).update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('更新图片记录失败:', error);
      throw new Error(`更新图片记录失败: ${error}`);
    }
  }

  async getPhotoById(photoId: string): Promise<Photo | null> {
    try {
      const result = await this.db.collection('photos').doc(photoId).get();
      if (result.data) {
        return {
          ...result.data,
          id: result.data._id || result.data.id || photoId,
        } as Photo;
      }
      return null;
    } catch (error) {
      console.error('获取图片失败:', error);
      return null;
    }
  }

  async searchPhotos(userId: string, query: {
    name?: string;
    tags?: string[];
    relatedPeople?: string[];
    projectId?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<Photo[]> {
    try {
      let dbQuery = this.db.collection('photos').where({ userId: userId });
      
      if (query.projectId) {
        dbQuery = dbQuery.where({ projectId: query.projectId });
      }

      const result = await dbQuery.orderBy('createdAt', 'desc').get();
      
      let photos = result.data.map((item: any) => ({
        ...item,
        id: item._id || item.id,
      })) as Photo[];

      // 客户端过滤（CloudBase查询限制）
      if (query.name) {
        photos = photos.filter(photo => 
          photo.name.toLowerCase().includes(query.name!.toLowerCase())
        );
      }

      if (query.tags && query.tags.length > 0) {
        photos = photos.filter(photo => 
          photo.tags?.some(tag => query.tags!.includes(tag))
        );
      }

      if (query.relatedPeople && query.relatedPeople.length > 0) {
        photos = photos.filter(photo => 
          photo.relatedPeople?.some(person => query.relatedPeople!.includes(person))
        );
      }

      if (query.dateRange) {
        photos = photos.filter(photo => {
          const photoDate = photo.photographyDate || photo.createdAt;
          return photoDate >= query.dateRange!.start && photoDate <= query.dateRange!.end;
        });
      }

      return photos;
    } catch (error) {
      console.error('搜索图片失败:', error);
      return [];
    }
  }

  async deletePhoto(photoId: string): Promise<void> {
    try {
      await this.db.collection('photos').doc(photoId).remove();
    } catch (error) {
      console.error('删除图片记录失败:', error);
      throw new Error(`删除图片记录失败: ${error}`);
    }
  }

  // 音频相关操作
  async createAudioRecording(audioData: Omit<AudioRecording, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const result = await this.db.collection('audioRecordings').add({
        ...audioData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return result.id;
    } catch (error) {
      console.error('创建音频记录失败:', error);
      throw new Error(`创建音频记录失败: ${error}`);
    }
  }

  async getChapterAudioRecordings(chapterId: string): Promise<AudioRecording[]> {
    try {
      const result = await this.db.collection('audioRecordings')
        .where({ chapterId: chapterId })
        .orderBy('createdAt', 'desc')
        .get();
      return result.data as AudioRecording[];
    } catch (error) {
      console.error('获取章节音频失败:', error);
      return [];
    }
  }

  async deleteAudioRecording(audioId: string): Promise<void> {
    try {
      await this.db.collection('audioRecordings').doc(audioId).remove();
    } catch (error) {
      console.error('删除音频记录失败:', error);
      throw new Error(`删除音频记录失败: ${error}`);
    }
  }

  // 统计相关
  async getUserStats(userId: string): Promise<{
    projectCount: number;
    chapterCount: number;
    totalWords: number;
  }> {
    try {
      if (!this.db) {
        console.warn('数据库服务不可用，返回空统计');
        return { projectCount: 0, chapterCount: 0, totalWords: 0 };
      }
      
      const projects = await this.getUserProjects(userId);
      
      // 确保 projects 是数组
      if (!Array.isArray(projects)) {
        console.warn('getUserProjects 返回的不是数组:', projects);
        return { projectCount: 0, chapterCount: 0, totalWords: 0 };
      }
      
      let chapterCount = 0;
      let totalWords = 0;

      for (const project of projects) {
        // 确保项目对象存在
        if (!project || !project.id) {
          console.warn('项目对象无效，跳过:', project);
          continue;
        }
        
        const chapters = await this.getProjectChapters(project.id);
        
        // 确保 chapters 是数组
        if (Array.isArray(chapters)) {
          chapterCount += chapters.length;
          
          for (const chapter of chapters) {
            // 简单的字数统计（去除HTML标签）
            if (chapter && chapter.content && typeof chapter.content === 'string') {
              const textContent = chapter.content.replace(/<[^>]*>/g, '');
              totalWords += textContent.length;
            }
          }
        } else {
          console.warn('chapters不是数组，跳过项目:', project.id);
        }
      }

      return {
        projectCount: projects.length,
        chapterCount,
        totalWords,
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return { projectCount: 0, chapterCount: 0, totalWords: 0 };
    }
  }

  // 计算项目总字数的辅助方法
  async calculateProjectWordCount(projectId: string): Promise<number> {
    try {
      const chapters = await this.getProjectChapters(projectId);
      
      return chapters.reduce((total, chapter) => {
        if (chapter && chapter.content && typeof chapter.content === 'string') {
          const textContent = chapter.content.replace(/<[^>]*>/g, '');
          return total + textContent.length;
        }
        return total;
      }, 0);
    } catch (error) {
      console.error('计算项目字数失败:', error);
      return 0;
    }
  }

  // 更新项目统计信息的方法
  async updateProjectStats(projectId: string): Promise<void> {
    try {
      const chapters = await this.getProjectChapters(projectId);
      const wordCount = chapters.reduce((total, chapter) => {
        if (chapter && chapter.content && typeof chapter.content === 'string') {
          const textContent = chapter.content.replace(/<[^>]*>/g, '');
          return total + textContent.length;
        }
        return total;
      }, 0);

      await this.updateProject(projectId, {
        chapterCount: chapters.length,
        wordCount,
        updatedAt: new Date()
      });

      console.log(`✅ 项目统计已更新: ${chapters.length}章节, ${wordCount}字`);
    } catch (error) {
      console.error('更新项目统计失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const databaseService = new DatabaseService(); 