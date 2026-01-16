import { Session } from "@prisma/client"

export interface FollowUpDto {
  appointmentDate?: Date;
  session: Session;
  reason?: string | null;
}