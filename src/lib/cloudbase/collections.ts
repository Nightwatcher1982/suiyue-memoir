import { getDatabase } from './config';
import type { 
  User, 
  MemoirProject, 
  Chapter, 
  Photo, 
  AudioRecording
} from '@/types';

// 集合名称常量
export const COLLECTIONS = {
  USERS: 'users',
  MEMOIR_PROJECTS: 'memoir_projects',
  CHAPTERS: 'chapters', 
  PHOTOS: 'photos',
  AUDIO_RECORDINGS: 'audio_recordings',
  CHARACTERS: 'characters',
} as const;

// 用户集合操作
export const usersCollection = {
  // 获取用户信息
  async getUser(userId: string): Promise<User | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const res = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      return res.data?.[0] || null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  // 创建或更新用户
  async upsertUser(userId: string, userData: Partial<User>): Promise<boolean> {
    try {
      const db = getDatabase();
      if (!db) return false;
      await db.collection(COLLECTIONS.USERS).doc(userId).set({
        ...userData,
        id: userId,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('创建/更新用户失败:', error);
      return false;
    }
  },
};

// 回忆录项目集合操作
export const memoirProjectsCollection = {
  // 获取用户的所有项目
  async getUserProjects(userId: string): Promise<MemoirProject[]> {
    try {
      const db = getDatabase();
      if (!db) return [];
      const res = await db.collection(COLLECTIONS.MEMOIR_PROJECTS)
        .where({ userId })
        .orderBy('updatedAt', 'desc')
        .get();
      return res.data || [];
    } catch (error) {
      console.error('获取用户项目失败:', error);
      return [];
    }
  },

  // 创建新项目
  async createProject(projectData: Omit<MemoirProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const res = await db.collection(COLLECTIONS.MEMOIR_PROJECTS).add({
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return (res as any).id || null;
    } catch (error) {
      console.error('创建项目失败:', error);
      return null;
    }
  },

  // 更新项目
  async updateProject(projectId: string, updates: Partial<MemoirProject>): Promise<boolean> {
    try {
      const db = getDatabase();
      if (!db) return false;
      await db.collection(COLLECTIONS.MEMOIR_PROJECTS).doc(projectId).update({
        ...updates,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('更新项目失败:', error);
      return false;
    }
  },

  // 获取单个项目
  async getProject(projectId: string): Promise<MemoirProject | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const res = await db.collection(COLLECTIONS.MEMOIR_PROJECTS).doc(projectId).get();
      return res.data?.[0] || null;
    } catch (error) {
      console.error('获取项目失败:', error);
      return null;
    }
  },
};

// 章节集合操作
export const chaptersCollection = {
  // 获取项目的所有章节
  async getProjectChapters(projectId: string): Promise<Chapter[]> {
    try {
      const db = getDatabase();
      if (!db) return [];
      const res = await db.collection(COLLECTIONS.CHAPTERS)
        .where({ projectId })
        .orderBy('order', 'asc')
        .get();
      return res.data || [];
    } catch (error) {
      console.error('获取项目章节失败:', error);
      return [];
    }
  },

  // 创建新章节
  async createChapter(chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const res = await db.collection(COLLECTIONS.CHAPTERS).add({
        ...chapterData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return (res as any).id || null;
    } catch (error) {
      console.error('创建章节失败:', error);
      return null;
    }
  },

  // 更新章节
  async updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<boolean> {
    try {
      const db = getDatabase();
      if (!db) return false;
      await db.collection(COLLECTIONS.CHAPTERS).doc(chapterId).update({
        ...updates,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('更新章节失败:', error);
      return false;
    }
  },
};

// 照片集合操作
export const photosCollection = {
  // 添加照片记录
  async addPhoto(photoData: Omit<Photo, 'id'>): Promise<string | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const res = await db.collection(COLLECTIONS.PHOTOS).add(photoData);
      return (res as any).id || null;
    } catch (error) {
      console.error('添加照片记录失败:', error);
      return null;
    }
  },

  // 获取照片信息
  async getPhoto(photoId: string): Promise<Photo | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const res = await db.collection(COLLECTIONS.PHOTOS).doc(photoId).get();
      return res.data?.[0] || null;
    } catch (error) {
      console.error('获取照片信息失败:', error);
      return null;
    }
  },
};

// 语音记录集合操作
export const audioRecordingsCollection = {
  // 添加语音记录
  async addRecording(recordingData: Omit<AudioRecording, 'id'>): Promise<string | null> {
    try {
      const db = getDatabase();
      if (!db) return null;
      const res = await db.collection(COLLECTIONS.AUDIO_RECORDINGS).add(recordingData);
      return (res as any).id || null;
    } catch (error) {
      console.error('添加语音记录失败:', error);
      return null;
    }
  },

  // 更新语音记录（主要用于更新转录结果）
  async updateRecording(recordingId: string, updates: Partial<AudioRecording>): Promise<boolean> {
    try {
      const db = getDatabase();
      if (!db) return false;
      await db.collection(COLLECTIONS.AUDIO_RECORDINGS).doc(recordingId).update(updates);
      return true;
    } catch (error) {
      console.error('更新语音记录失败:', error);
      return false;
    }
  },
}; 