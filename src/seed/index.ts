import { seedAdmin } from "./admin.seed";
import { seedServiceItems } from "./service-item.seed";

export const runSeeds = async () => {
  await seedAdmin();
  await seedServiceItems();
};
