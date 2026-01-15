import { seedAdmin } from "./admin.seed";

export const runSeeds = async () => {
  await seedAdmin();
};
