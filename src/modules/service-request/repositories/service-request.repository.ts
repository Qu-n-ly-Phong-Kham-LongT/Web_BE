import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export interface CreateServiceRequestDetailPayload {
  itemId: string;
  selectedOptions: Prisma.InputJsonValue;
}

export interface CreateServiceRequestPayload {
  recordId: string;
  orderingDoctorId?: string;
  diagnoses?: Prisma.InputJsonValue | null;
  isPatientRequested?: boolean;
  receiveResultAtClinic?: boolean;
  isForFollowUp?: boolean;
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

export type ServiceRequestWithDetailsAndResults =
  Prisma.ServiceRequestGetPayload<{
    include: {
      medicalRecord: {
        select: {
          recordCode: true;
          patientId: true;
          clinicId: true;
        };
      };
      details: {
        include: {
          serviceItem: {
            include: {
              configs: true;
            };
          };
        };
      };
      serviceResults: {
        include: {
          serviceItemConfig: true;
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
          diagnoses: createData.diagnoses ?? Prisma.JsonNull,
          isPatientRequested: createData.isPatientRequested ?? false,
          receiveResultAtClinic: createData.receiveResultAtClinic ?? false,
          isForFollowUp: createData.isForFollowUp ?? false,
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
          diagnoses: createData.diagnoses ?? Prisma.JsonNull,
          isPatientRequested: createData.isPatientRequested ?? false,
          receiveResultAtClinic: createData.receiveResultAtClinic ?? false,
          isForFollowUp: createData.isForFollowUp ?? false,
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

  public async findByIdWithDetailsAndResults(
    requestId: string,
    tx?: Prisma.TransactionClient
  ): Promise<ServiceRequestWithDetailsAndResults | null> {
    const client = tx ?? prisma;
    return await client.serviceRequest.findUnique({
      where: { requestId },
      include: {
        medicalRecord: {
          select: {
            recordCode: true,
            patientId: true,
            clinicId: true,
          },
        },
        details: {
          include: {
            serviceItem: {
              include: {
                configs: true,
              },
            },
          },
        },
        serviceResults: {
          include: {
            serviceItemConfig: true,
          },
        },
      },
    });
  }

  public async getDataPrint(requestId: string) {
    return await prisma.serviceRequest.findUnique({
      where: { requestId },
      include: {
        medicalRecord: {
          include: {
            patient: true,
          },
        },
        orderingDoctor: true,
        details: {
          include: {
            serviceItem: {
              include: {
                type: true,
                configs: true,
              },
            },
          },
        },
      },
    });
  }
}
