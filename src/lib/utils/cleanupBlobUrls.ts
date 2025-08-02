import { databaseService } from '@/lib/cloudbase/database';
import type { Photo } from '@/types';

export async function cleanupBlobUrls(userId: string): Promise<{
  cleaned: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let cleaned = 0;

  try {
    console.log('🧹 开始清理用户的blob URL照片数据...');
    
    // 获取用户所有照片
    const photos = await databaseService.getUserPhotos(userId);
    console.log(`📊 找到 ${photos.length} 张照片`);

    // 找到所有使用blob URL的照片
    const blobPhotos = photos.filter(photo => 
      photo.url && photo.url.startsWith('blob:')
    );
    
    console.log(`🔍 发现 ${blobPhotos.length} 张使用blob URL的照片`);

    if (blobPhotos.length === 0) {
      console.log('✅ 没有发现blob URL，数据库已清理');
      return { cleaned: 0, errors: [] };
    }

    // 删除这些无效的照片记录
    for (const photo of blobPhotos) {
      try {
        console.log(`🗑️ 删除无效照片记录: ${photo.name} (${photo.id})`);
        await databaseService.deletePhoto(photo.id);
        cleaned++;
      } catch (error) {
        const errorMsg = `删除照片 ${photo.name} 失败: ${error}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`✅ 清理完成！删除了 ${cleaned} 张无效照片记录`);
    
    return { cleaned, errors };
  } catch (error) {
    const errorMsg = `清理过程发生错误: ${error}`;
    console.error('❌', errorMsg);
    errors.push(errorMsg);
    return { cleaned, errors };
  }
}

// 清理所有用户的blob URL数据
export async function cleanupAllBlobUrls(): Promise<{
  totalCleaned: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let totalCleaned = 0;

  try {
    console.log('🧹 开始全局清理blob URL照片数据...');
    
    // 这里我们需要一个获取所有照片的方法
    // 由于没有直接的API，我们可以通过数据库直接查询
    const db = (databaseService as any).db;
    const result = await db.collection('photos').get();
    const allPhotos = result.data as Photo[];
    
    console.log(`📊 总共找到 ${allPhotos.length} 张照片`);

    // 找到所有使用blob URL的照片
    const blobPhotos = allPhotos.filter(photo => 
      photo.url && photo.url.startsWith('blob:')
    );
    
    console.log(`🔍 发现 ${blobPhotos.length} 张使用blob URL的照片`);

    if (blobPhotos.length === 0) {
      console.log('✅ 没有发现blob URL，数据库已清理');
      return { totalCleaned: 0, errors: [] };
    }

    // 删除这些无效的照片记录
    for (const photo of blobPhotos) {
      try {
        console.log(`🗑️ 删除无效照片记录: ${photo.name} (${photo.id})`);
        await databaseService.deletePhoto(photo.id);
        totalCleaned++;
      } catch (error) {
        const errorMsg = `删除照片 ${photo.name} 失败: ${error}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`✅ 全局清理完成！删除了 ${totalCleaned} 张无效照片记录`);
    
    return { totalCleaned, errors };
  } catch (error) {
    const errorMsg = `全局清理过程发生错误: ${error}`;
    console.error('❌', errorMsg);
    errors.push(errorMsg);
    return { totalCleaned, errors };
  }
}