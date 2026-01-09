import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export interface CreateServiceRequestDetailPayload {
  itemId: string;
  selectedOptions: Prisma.InputJsonValue;
}

export interface CreateServiceRequestPayload {
  recordId: string;
  orderingDoctorId?: string;
  note?: string | null;
  details: CreateServiceRequestDetailPayload[];
}

export type ServiceRequestWithDetails = Prisma.ServiceRequestGetPayload<{
  include: {
    details: {
      include: {
        serviceItem: true;
      };
    };
  };
}>;

export class ServiceRequestRepository {
  public async create(
    createData: CreateServiceRequestPayload,
    tx?: Prisma.TransactionClient
  ): Promise<ServiceRequestWithDetails> {
    if (tx) {
      const createdRequest = await tx.serviceRequest.create({
        data: {
          recordId: createData.recordId,
          orderingDoctorId: createData.orderingDoctorId,
          note: createData.note ?? null,
        },
      });

      await tx.serviceRequestDetail.createMany({
        data: createData.details.map((detail) => ({
          requestId: createdRequest.requestId,
          itemId: detail.itemId,
          selectedOptions: detail.selectedOptions ?? Prisma.JsonNull,
        })),
      });

      return await tx.serviceRequest.findUniqueOrThrow({
        where: { requestId: createdRequest.requestId },
        include: {
          details: {
            include: {
              serviceItem: true,
            },
          },
        },
      });
    }

    return await prisma.$transaction(async (tx) => {
      const createdRequest = await tx.serviceRequest.create({
        data: {
          recordId: createData.recordId,
          orderingDoctorId: createData.orderingDoctorId,
          note: createData.note ?? null,
        },
      });

      await tx.serviceRequestDetail.createMany({
        data: createData.details.map((detail) => ({
          requestId: createdRequest.requestId,
          itemId: detail.itemId,
          selectedOptions: detail.selectedOptions ?? Prisma.JsonNull,
        })),
      });

      return await tx.serviceRequest.findUniqueOrThrow({
        where: { requestId: createdRequest.requestId },
        include: {
          details: {
            include: {
              serviceItem: true,
            },
          },
        },
      });
    });
  }
}
