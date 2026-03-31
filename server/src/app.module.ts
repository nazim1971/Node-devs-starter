import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CloudinaryModule } from "./modules/cloudinary/cloudinary.module";
import { AdminModule } from "./modules/admin/admin.module";
import { User } from "./modules/users/entities/user.entity";
import { Session } from "./modules/users/entities/session.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.get<string>("DATABASE_URL"),
        entities: [User, Session],
        synchronize: config.get<string>("NODE_ENV") !== "production",
        ssl:
          config.get<string>("NODE_ENV") === "production"
            ? { rejectUnauthorized: false }
            : false,
        logging: config.get<string>("NODE_ENV") === "development",
      }),
    }),
    AuthModule,
    UsersModule,
    CloudinaryModule,
    AdminModule,
  ],
})
export class AppModule {}
