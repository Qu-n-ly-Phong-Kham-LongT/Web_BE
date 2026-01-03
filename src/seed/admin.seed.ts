import bcrypt from "bcrypt";
import { prisma } from "../config/database.config";
import { UserRoleEnum, UserStatus } from "@prisma/client";

const DEFAULT_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || "admin";
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "123456";
const DEFAULT_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";

const DEFAULT_CLINIC_EMAIL = process.env.SEED_CLINIC_EMAIL || "default.clinic@example.com";

export const seedAdmin = async () => {
  const clinic = await prisma.clinic.upsert({
    where: { Email: DEFAULT_CLINIC_EMAIL },
    update: {},
    create: {
      ClinicName: "Default Clinic",
      Email: DEFAULT_CLINIC_EMAIL,
      Address: "N/A",
      Phone: null,
    },
  });

  await Promise.all([
    prisma.role.upsert({
      where: { RoleName: UserRoleEnum.Admin },
      update: {},
      create: { RoleName: UserRoleEnum.Admin },
    }),
    prisma.role.upsert({
      where: { RoleName: UserRoleEnum.Doctor },
      update: {},
      create: { RoleName: UserRoleEnum.Doctor },
    }),
    prisma.role.upsert({
      where: { RoleName: UserRoleEnum.Manager },
      update: {},
      create: { RoleName: UserRoleEnum.Manager },
    }),
  ]);

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { Username: DEFAULT_ADMIN_USERNAME },
    update: {},
    create: {
      Username: DEFAULT_ADMIN_USERNAME,
      Password: hashedPassword,
      FullName: "System Admin",
      Email: DEFAULT_ADMIN_EMAIL,
      Status: UserStatus.Active,
      clinicId: clinic.ClinicID,
      roles: {
        create: [
          {
            role: {
              connect: { RoleName: UserRoleEnum.Admin },
            },
          },
        ],
      },
    },
  });
};
