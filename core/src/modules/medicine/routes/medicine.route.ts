import { Router } from "express";
import { MedicineController } from "../controllers/medicine.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreateMedicineRequestSchema } from "../dtos/create-medicine.request.dto";
import { UpdateMedicineRequestSchema } from "../dtos/update-medicine.request.dto";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";
import { UserRoleEnum } from "@prisma/client";

const medicineRouter = Router();

const medicineController = new MedicineController();

medicineRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_MEDICINE", "Medicine"),
  validateBody(CreateMedicineRequestSchema),
  medicineController.createMedicine,
);

medicineRouter.get("/", authenticate, medicineController.getMedicines);

medicineRouter.get("/:id", authenticate, medicineController.getMedicineById);

medicineRouter.put(
  "/:id",
  authenticate,
  auditLogsMiddleware("UPDATE_MEDICINE", "Medicine"),
  validateBody(UpdateMedicineRequestSchema),
  medicineController.updateMedicine,
);

medicineRouter.delete(
  "/:id",
  authenticate,
  auditLogsMiddleware("DELETE_MEDICINE", "Medicine"),
  authorize([UserRoleEnum.Admin]),
  medicineController.deleteMedicine,
);

export default medicineRouter;
