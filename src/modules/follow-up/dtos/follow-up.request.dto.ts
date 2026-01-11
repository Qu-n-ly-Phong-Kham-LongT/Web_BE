import { Session } from "@prisma/client"
import Joi from "joi"

export interface FollowUpDto {
  appointmentDate?: Date;
  session: Session;
  reason?: string | null;
}