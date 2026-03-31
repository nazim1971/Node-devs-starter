import {
  Controller,
  Post,
  UseGuards,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloudinaryService } from "./cloudinary.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@app/shared";

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

  @Post("image")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor("image", {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          return cb(
            new BadRequestException("Only image files are allowed"),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query("folder") folder?: string,
  ) {
    if (!file) throw new BadRequestException("No image file provided");
    const result = await this.cloudinaryService.uploadImage(
      file.buffer,
      folder ?? "products",
    );
    return { data: result, message: "Image uploaded successfully" };
  }

  @Delete("image")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteProductImage(@Body("publicId") publicId: string) {
    if (!publicId) {
      return { data: null, message: "publicId is required" };
    }
    await this.cloudinaryService.deleteImage(publicId);
    return { data: null, message: "Image deleted successfully" };
  }
}
