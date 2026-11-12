import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.ts";
import { logger } from "../logger.ts";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = async (
  filePath: string,
  publicId: string,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    resource_type: "image",
    overwrite,
  });

  return result.secure_url;
};

export const destroyImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error: unknown) {
    logger.warn({ err: error, publicId }, "Failed to remove image");
  }
};
