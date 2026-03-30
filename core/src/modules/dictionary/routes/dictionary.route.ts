import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { DictionaryController } from "../controllers/dictionary.controller";
import {
  DictionaryRequestSchema,
  DictionaryUpdateSchema,
} from "../dtos/dictionary.request.dto";
import {
  DictionaryBulkDeleteSchema,
  DictionaryBulkInsertSchema,
} from "../dtos/dictionary.bulk.dto";

const dictionaryRouter = Router();
const controller = new DictionaryController();

dictionaryRouter.get(
  "/",
  authenticate,
  controller.list
);

dictionaryRouter.post(
  "/bulk",
  authenticate,
  validateBody(DictionaryBulkInsertSchema),
  controller.insertBulk
);

dictionaryRouter.delete(
  "/bulk",
  authenticate,
  validateBody(DictionaryBulkDeleteSchema),
  controller.deleteBulk
);

dictionaryRouter.post(
  "/",
  authenticate,
  validateBody(DictionaryRequestSchema),
  controller.create
);

dictionaryRouter.get(
  "/:key",
  authenticate,
  controller.getByKey
);

dictionaryRouter.put(
  "/:key",
  authenticate,
  validateBody(DictionaryUpdateSchema),
  controller.update
);

dictionaryRouter.delete(
  "/:key",
  authenticate,
  controller.delete
);

export default dictionaryRouter;
