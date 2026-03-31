import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductInput, UpdateProductInput } from "@app/shared";

const PRODUCT_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  price: true,
  image: true,
  imagePublicId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(query.limit ?? 12, 100);
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              {
                title: { contains: query.search, mode: "insensitive" as const },
              },
              {
                description: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: PRODUCT_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => ({ ...p, price: p.price.toString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: PRODUCT_SELECT,
    });
    if (!product || product.deletedAt !== null) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return { ...product, price: product.price.toString() };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });
    if (!product || product.deletedAt !== null) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return { ...product, price: product.price.toString() };
  }

  async create(dto: CreateProductInput) {
    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    const product = await this.prisma.product.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        image: dto.image ?? null,
        imagePublicId: dto.imagePublicId ?? null,
      },
      select: PRODUCT_SELECT,
    });

    return { ...product, price: product.price.toString() };
  }

  async update(id: string, dto: UpdateProductInput) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt !== null) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== product.slug) {
      const slugTaken = await this.prisma.product.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (slugTaken)
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.imagePublicId !== undefined && {
          imagePublicId: dto.imagePublicId,
        }),
      },
      select: PRODUCT_SELECT,
    });

    return { ...updated, price: updated.price.toString() };
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt !== null) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
