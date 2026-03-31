import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from "typeorm";
import { Role } from "@app/shared";
import { Session } from "./session.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ nullable: true, type: "varchar", length: 500 })
  avatar!: string | null;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isBanned!: boolean;

  @Column({ nullable: true, type: "varchar", length: 100 })
  passwordResetToken!: string | null;

  @Column({ nullable: true, type: "timestamp" })
  passwordResetExpires!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true, type: "timestamp" })
  deletedAt!: Date | null;

  @OneToMany(() => Session, (session: Session) => session.user, {
    cascade: true,
  })
  sessions!: Session[];
}
