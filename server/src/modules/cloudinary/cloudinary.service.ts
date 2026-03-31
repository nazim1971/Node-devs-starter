import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  publicId: string;
  folder: string;
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
