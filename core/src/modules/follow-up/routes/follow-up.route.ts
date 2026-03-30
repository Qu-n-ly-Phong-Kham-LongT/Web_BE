import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateQuery } from "../../../middlewares/validate";
import { FollowUpController } from "../controllers/follow-up.controller";
import { getFollowUpsQuerySchema } from "../dtos/follow-up.request.dto";

const followUpRouter = Router();
const followUpController = new FollowUpController();

followUpRouter.get(
  "/",
  authenticate,
  validateQuery(getFollowUpsQuerySchema),
  followUpController.getFollowUps,
);

export default followUpRouter;
