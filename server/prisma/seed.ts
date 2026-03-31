import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env["ADMIN_EMAIL"] ?? "admin@example.com";
  const password = process.env["ADMIN_PASSWORD"] ?? "Admin1234!";
  const name = process.env["ADMIN_NAME"] ?? "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: Role.admin,
    },
  });

  console.log(`✅ Admin created: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
