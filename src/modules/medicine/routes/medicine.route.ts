import { Router } from "express";
import { MedicineController } from "../controllers/medicine.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreateMedicineRequestSchema } from "../dtos/create-medicine.request.dto";
import { UpdateMedicineRequestSchema } from "../dtos/update-medicine.request.dto";
import { authenticate } from "../../../middlewares/auth.middleware";

const medicineRouter = Router();

const medicineController = new MedicineController();

medicineRouter.post(
    "/",
    authenticate,
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
    validateBody(UpdateMedicineRequestSchema),
    medicineController.updateMedicine
);

export default medicineRouter;

