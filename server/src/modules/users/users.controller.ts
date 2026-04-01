import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ForbiddenException,
} from "@nestjs/common";
import {
  Role,
  updateProfileSchema,
  changePasswordSchema,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@app/shared";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { User } from "@prisma/client";
import { changeRoleDtoSchema, type ChangeRoleDto } from "./dto";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Query("page") page?: string, @Query("limit") limit?: string) {
    const result = await this.usersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return {
      data: {
        users: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      message: "Users retrieved successfully",
    };
  }

  @Get("me")
  async getMe(@CurrentUser() currentUser: User) {
    const user = await this.usersService.findById(currentUser.id);
    return { data: user, message: "User retrieved successfully" };
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    // Non-admins can only view their own profile
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException("You can only view your own profile");
    }
    const user = await this.usersService.findById(id);
    return { data: user, message: "User retrieved successfully" };
  }

  @Patch(":id")
  async updateProfile(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileInput,
    @CurrentUser() currentUser: User,
  ) {
    // Non-admins can only update their own profile
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException("You can only update your own profile");
    }
    const user = await this.usersService.updateProfile(id, dto, currentUser.id);
    return { data: user, message: "Profile updated successfully" };
  }

  @Patch(":id/password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordInput,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id !== id) {
      throw new ForbiddenException("You can only change your own password");
    }
    await this.usersService.changePassword(id, dto);
    return { data: null, message: "Password changed successfully" };
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id === id) {
      throw new ForbiddenException("You cannot delete your own account");
    }
    await this.usersService.softDelete(id);
    return { data: null, message: "User deleted successfully" };
  }

  @Get(":id/activity")
  @Roles(Role.ADMIN)
  async getActivity(@Param("id", ParseUUIDPipe) id: string) {
    const activity = await this.usersService.getActivity(id);
    return { data: activity, message: "Activity retrieved successfully" };
  }

  @Patch(":id/ban")
  @Roles(Role.ADMIN)
  async toggleBan(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id === id) {
      throw new ForbiddenException("You cannot ban your own account");
    }
    const user = await this.usersService.toggleBan(id);
    const action = user.isBanned ? "banned" : "unbanned";
    return { data: user, message: `User ${action} successfully` };
  }

  @Patch(":id/role")
  @Roles(Role.ADMIN)
  async changeRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(changeRoleDtoSchema)) body: ChangeRoleDto,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id === id) {
      throw new ForbiddenException("You cannot change your own role");
    }
    const user = await this.usersService.changeRole(id, body.role);
    return { data: user, message: "User role updated successfully" };
  }
}
