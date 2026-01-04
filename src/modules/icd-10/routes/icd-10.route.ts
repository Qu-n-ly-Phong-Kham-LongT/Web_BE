import { Router } from "express";
import { Icd10Controller } from "../controllers/icd-10.controller";
import { validateBody } from "../../../middlewares/validate";
import { Icd10RequestSchema } from "../dtos/icd-10.dto";
import { authenticate } from "../../../middlewares/auth.middleware";

const icd10Router = Router();
const icd10Controller = new Icd10Controller();

icd10Router.post(
  "/",
  authenticate,
  validateBody(Icd10RequestSchema),
  icd10Controller.createIcd10
);

icd10Router.get(
  "/",
  authenticate,
  icd10Controller.getAllIcd10
);

icd10Router.put(
  "/:code",
  authenticate,
  validateBody(Icd10RequestSchema),
  icd10Controller.updateIcd10
);

export default icd10Router;
