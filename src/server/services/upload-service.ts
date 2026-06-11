import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api-errors";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "blog");

export async function saveBlogImage(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new ApiError(400, "No image file provided.", "VALIDATION_ERROR");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(400, "Image must be 5MB or smaller.", "VALIDATION_ERROR");
  }

  const extension = ALLOWED_MIME_TYPES.get(file.type);
  if (!extension) {
    throw new ApiError(400, "Only JPEG, PNG, and WebP images are allowed.", "VALIDATION_ERROR");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const id = randomUUID();
  const filename = `${id}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/blog/${filename}`;
}
