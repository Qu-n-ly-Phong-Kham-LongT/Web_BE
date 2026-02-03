import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { StatisticController } from "../controllers/statistic.controller";

const router = Router();
const controller = new StatisticController();

router.get("/dashboard", authenticate, controller.getDashboard);
router.get("/range-types", authenticate, controller.getRangeTypes);
router.get(
  "/prescriptions/revenue",
  authenticate,
  controller.getPrescriptionRevenueByMedicine,
);
router.get("/revenue", authenticate, controller.getRevenueStatistics);
export default router;
