
// backend/src/services/fileUpload.ts
 
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { supabase, STORAGE_BUCKET } from '@/config/supabase';

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
}

export class FileUploadService {
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    category: string = 'general'
  ): Promise<UploadedFile> {
    try {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = `${userId}/${category}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return {
        id: fileId,
        originalName: file.originalname,
        fileName,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('File upload failed');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('File deletion failed');
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error || !data) {
        throw new Error(`Signed URL generation failed: ${error?.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw new Error('Signed URL generation failed');
    }
  }
}

export const fileUploadService = new FileUploadService();
