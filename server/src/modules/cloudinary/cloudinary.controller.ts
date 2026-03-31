import {
  Controller,
  Post,
  UseGuards,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post("avatar")
  @HttpCode(HttpStatus.OK)
  getSignedUploadUrl(@Body("publicId") publicId: string) {
    const safePublicId = publicId ?? `avatar-${Date.now()}`;
    const params =
      this.cloudinaryService.generateSignedUploadParams(safePublicId);
    return {
      data: params,
      message: "Signed upload URL generated successfully",
    };
  }

  @Delete("avatar")
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@Body("publicId") publicId: string) {
    if (!publicId) {
      return { data: null, message: "publicId is required" };
    }
    await this.cloudinaryService.deleteImage(publicId);
    return { data: null, message: "Image deleted successfully" };
  }
}
