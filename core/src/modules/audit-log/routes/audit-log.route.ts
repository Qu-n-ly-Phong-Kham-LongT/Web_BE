import { Router } from "express";
import { UserRoleEnum } from "@prisma/client";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { AuditLogController } from "../controllers/audit-log.controller";

const auditLogRouter = Router();
const auditLogController = new AuditLogController();

auditLogRouter.get(
  "/",
  authenticate,
  authorize([UserRoleEnum.Admin, UserRoleEnum.Manager]),
  auditLogController.getAuditLogs,
);

export default auditLogRouter;
