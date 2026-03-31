import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CloudinaryService } from "./cloudinary.service";
import { CloudinaryController } from "./cloudinary.controller";

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService],
  controllers: [CloudinaryController],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
