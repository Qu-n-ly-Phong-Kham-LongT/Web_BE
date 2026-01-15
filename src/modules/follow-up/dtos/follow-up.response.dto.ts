import { Session } from "@prisma/client";

export interface FollowUpResponseDto {
  appointmentDate?: Date | null;
  session?: Session | null;
  reason?: string | null;
}    