import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  publicId: string;
  folder: string;
}

export interface UploadedImageResult {
  url: string;
  secureUrl: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET"),
    });
  }

  async uploadImage(
    buffer: Buffer,
    folder = "products",
  ): Promise<UploadedImageResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error ?? new Error("Upload failed"));
          }
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  generateSignedUploadParams(publicId: string): SignedUploadParams {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "avatars";
    const apiSecret =
      this.configService.get<string>("CLOUDINARY_API_SECRET") ?? "";

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, public_id: publicId, folder },
      apiSecret,
    );

    return {
      signature,
      timestamp,
      apiKey: this.configService.get<string>("CLOUDINARY_API_KEY") ?? "",
      cloudName: this.configService.get<string>("CLOUDINARY_CLOUD_NAME") ?? "",
      publicId,
      folder,
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
