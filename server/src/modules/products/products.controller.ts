import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProductsService } from "./products.service";
import { UploadService } from "../upload/upload.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  Role,
  createProductSchema,
  updateProductSchema,
  CreateProductInput,
  UpdateProductInput,
} from "@app/shared";

const imageInterceptor = FileInterceptor("image", {
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new BadRequestException("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

@Controller("products")
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService,
  ) {}

  // ── Public endpoints ───────────────────────────────────────────────────────

  @Get()
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    const result = await this.productsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
    return {
      data: {
        products: result.products,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      message: "Products retrieved successfully",
    };
  }

  @Get(":slug")
  async findOne(@Param("slug") slug: string) {
    const product = await this.productsService.findBySlug(slug);
    return { data: product, message: "Product retrieved successfully" };
  }

  // ── Admin-only endpoints ───────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(imageInterceptor)
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    let image: string | null = null;
    let imagePublicId: string | null = null;

    if (file) {
      const uploaded = await this.uploadService.uploadImage(
        file.buffer,
        "products",
      );
      image = uploaded.secureUrl;
      imagePublicId = uploaded.publicId;
    }

    const parsed = {
      title: body["title"] as string,
      slug: body["slug"] as string,
      description: body["description"] as string,
      price: parseFloat(body["price"] as string),
      image: (body["image"] as string | undefined) ?? image,
      imagePublicId:
        (body["imagePublicId"] as string | undefined) ?? imagePublicId,
    };

    const pipe = new ZodValidationPipe(createProductSchema);
    const dto = pipe.transform(parsed) as CreateProductInput;

    const product = await this.productsService.create(dto);
    return { data: product, message: "Product created successfully" };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(imageInterceptor)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    let image: string | undefined;
    let imagePublicId: string | undefined;

    if (file) {
      const uploaded = await this.uploadService.uploadImage(
        file.buffer,
        "products",
      );
      image = uploaded.secureUrl;
      imagePublicId = uploaded.publicId;
    }

    const parsed: Record<string, unknown> = {};
    if (body["title"] !== undefined) parsed["title"] = body["title"];
    if (body["slug"] !== undefined) parsed["slug"] = body["slug"];
    if (body["description"] !== undefined)
      parsed["description"] = body["description"];
    if (body["price"] !== undefined)
      parsed["price"] = parseFloat(body["price"] as string);
    if (image !== undefined) parsed["image"] = image;
    if (imagePublicId !== undefined) parsed["imagePublicId"] = imagePublicId;
    if (body["image"] !== undefined && image === undefined)
      parsed["image"] = body["image"];
    if (body["imagePublicId"] !== undefined && imagePublicId === undefined)
      parsed["imagePublicId"] = body["imagePublicId"];

    const pipe = new ZodValidationPipe(updateProductSchema);
    const dto = pipe.transform(parsed) as UpdateProductInput;

    const product = await this.productsService.update(id, dto);
    return { data: product, message: "Product updated successfully" };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.productsService.remove(id);
    return { data: null, message: "Product deleted successfully" };
  }
}
