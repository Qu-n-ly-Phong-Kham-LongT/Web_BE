import { Router } from "express";
import { MedicineController } from "../controllers/medicine.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreateMedicineRequestSchema } from "../dtos/create-medicine.request.dto";
import { UpdateMedicineRequestSchema } from "../dtos/update-medicine.request.dto";
import { authenticate } from "../../../middlewares/auth.middleware";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const medicineRouter = Router();

const medicineController = new MedicineController();

medicineRouter.post(
    "/",
    authenticate,
    auditLogsMiddleware("CREATE_MEDICINE", "Medicine"),
    validateBody(CreateMedicineRequestSchema),
    medicineController.createMedicine
);

medicineRouter.get(
    "/",
    authenticate,
    medicineController.getMedicines
);

medicineRouter.get(
    "/:id",
    authenticate,
    medicineController.getMedicineById
);

medicineRouter.put(
    "/:id",
    authenticate,
    auditLogsMiddleware("UPDATE_MEDICINE", "Medicine"),
    validateBody(UpdateMedicineRequestSchema),
    medicineController.updateMedicine
);

export default medicineRouter;

