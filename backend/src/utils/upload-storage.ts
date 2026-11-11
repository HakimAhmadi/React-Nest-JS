import { promises as fs } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export const uploadFolders: readonly string[] = Object.freeze([
  'avatars',
  'media',
  'documents',
]);

export function uploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim() || process.env.UPLOAD_ROOT?.trim();
  if (configured) {
    if (!isAbsolute(configured)) {
      return resolve(process.cwd(), configured);
    }
    return resolve(configured);
  }
  return resolve(process.cwd(), 'uploads');
}

export async function initializeUploadStorage(): Promise<void> {
  const root = uploadRoot();
  await fs.mkdir(root, { recursive: true });
}
