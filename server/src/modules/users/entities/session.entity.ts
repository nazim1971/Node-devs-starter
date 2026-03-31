import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column({ length: 1000 })
  refreshToken!: string;

  @Column({ nullable: true, type: "varchar", length: 100 })
  ip!: string | null;

  @Column({ nullable: true, type: "varchar", length: 500 })
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user: User) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}
