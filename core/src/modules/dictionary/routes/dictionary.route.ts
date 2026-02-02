import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";
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
  auditLogsMiddleware("LIST_DICTIONARY", "Dictionary"),
  controller.list
);

dictionaryRouter.post(
  "/bulk",
  authenticate,
  auditLogsMiddleware("BULK_CREATE_DICTIONARY", "Dictionary"),
  validateBody(DictionaryBulkInsertSchema),
  controller.insertBulk
);

dictionaryRouter.delete(
  "/bulk",
  authenticate,
  auditLogsMiddleware("BULK_DELETE_DICTIONARY", "Dictionary"),
  validateBody(DictionaryBulkDeleteSchema),
  controller.deleteBulk
);

dictionaryRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_DICTIONARY", "Dictionary"),
  validateBody(DictionaryRequestSchema),
  controller.create
);

dictionaryRouter.get(
  "/:key",
  authenticate,
  auditLogsMiddleware("VIEW_DICTIONARY", "Dictionary"),
  controller.getByKey
);

dictionaryRouter.put(
  "/:key",
  authenticate,
  auditLogsMiddleware("UPDATE_DICTIONARY", "Dictionary"),
  validateBody(DictionaryUpdateSchema),
  controller.update
);

dictionaryRouter.delete(
  "/:key",
  authenticate,
  auditLogsMiddleware("DELETE_DICTIONARY", "Dictionary"),
  controller.delete
);

export default dictionaryRouter;
