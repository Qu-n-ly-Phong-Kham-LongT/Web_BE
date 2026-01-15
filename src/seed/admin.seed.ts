import bcrypt from "bcrypt";
import { prisma } from "../config/database.config";
import { UserRoleEnum, UserStatus } from "@prisma/client";

const DEFAULT_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || "admin";
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "123456";
const DEFAULT_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";

const DEFAULT_CLINIC_EMAIL = process.env.SEED_CLINIC_EMAIL || "default.clinic@example.com";
const DEFAULT_CLINIC_CODE = process.env.SEED_CLINIC_CODE || "PKH";

export const seedAdmin = async () => {
  const clinic = await prisma.clinic.upsert({
    where: { clinicCode: DEFAULT_CLINIC_CODE },
    update: {
      clinicName: "Default Clinic",
      email: DEFAULT_CLINIC_EMAIL,
      address: "N/A",
      phone: null,
    },
    create: {
      clinicName: "Default Clinic",
      email: DEFAULT_CLINIC_EMAIL,
      address: "N/A",
      phone: null,
      clinicCode: DEFAULT_CLINIC_CODE,
    },
  });

  await Promise.all([
    prisma.role.upsert({
      where: { roleName: UserRoleEnum.Admin },
      update: {},
      create: { roleName: UserRoleEnum.Admin },
    }),
    prisma.role.upsert({
      where: { roleName: UserRoleEnum.Doctor },
      update: {},
      create: { roleName: UserRoleEnum.Doctor },
    }),
    prisma.role.upsert({
      where: { roleName: UserRoleEnum.Manager },
      update: {},
      create: { roleName: UserRoleEnum.Manager },
    }),
  ]);

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { username: DEFAULT_ADMIN_USERNAME },
    update: {},
    create: {
      username: DEFAULT_ADMIN_USERNAME,
      password: hashedPassword,
      fullName: "System Admin",
      email: DEFAULT_ADMIN_EMAIL,
      status: UserStatus.Active,
      clinicId: clinic.clinicId,
      roles: {
        create: [
          {
            role: {
              connect: { roleName: UserRoleEnum.Admin },
            },
          },
        ],
      },
    },
  });
};
