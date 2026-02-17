import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)) * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

export interface UploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  width?: number;
  height?: number;
}

export async function processUpload(file: File): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Nepodporovaný formát souboru: ${file.type}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Soubor je příliš velký. Maximum je ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
  }

  // Generate unique filename
  const ext = path.extname(file.name);
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  const filename = `${timestamp}-${hash}${ext}`;

  // Create date-based directory
  const date = new Date();
  const subDir = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const uploadDir = path.join(UPLOAD_DIR, subDir);
  await mkdir(uploadDir, { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  // Get image dimensions if applicable
  let width: number | undefined;
  let height: number | undefined;

  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    try {
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;

      // Auto-generate WebP version
      const webpFilename = filename.replace(ext, '.webp');
      const webpPath = path.join(uploadDir, webpFilename);
      await sharp(buffer)
        .webp({ quality: 80 })
        .toFile(webpPath);
    } catch {
      // Sharp not available, skip image processing
    }
  }

  const publicPath = `/uploads/${subDir}/${filename}`;

  return {
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    path: publicPath,
    width,
    height,
  };
}
