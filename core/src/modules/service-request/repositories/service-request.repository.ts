import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { Session } from "@prisma/client";

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
  isFollowUpTransferred?: boolean;
  followUpDate?: Date | null;
  followUpSession?:
    | Prisma.EnumSessionFieldUpdateOperationsInput
    | Session
    | null;
  note?: string | null;
  isPrinted?: boolean;
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
  public async transferFollowUpRequestsToRecord(
    patientId: string,
    newRecordId: string,
  ): Promise<{ transferred: number; requests: ServiceRequestWithDetails[] }> {
    return await prisma.$transaction(async (tx) => {
      const requests = await tx.serviceRequest.findMany({
        where: {
          isForFollowUp: true,
          isFollowUpTransferred: false,
          medicalRecord: { patientId },
        },
        include: {
          details: true,
          serviceResults: true,
        },
        orderBy: { createdAt: "asc" },
      });

      if (requests.length === 0) {
        return { transferred: 0, requests: [] };
      }

      const createdRequests: ServiceRequestWithDetails[] = [];

      for (const request of requests) {
        const created = await tx.serviceRequest.create({
          data: {
            recordId: newRecordId,
            orderingDoctorId: request.orderingDoctorId ?? null,
            diagnoses: request.diagnoses ?? Prisma.JsonNull,
            isPatientRequested: request.isPatientRequested ?? false,
            receiveResultAtClinic: request.receiveResultAtClinic ?? false,
            isForFollowUp: false,
            isFollowUpTransferred: true,
            isPrinted: false,
            followUpDate: request.followUpDate ?? null,
            followUpSession: request.followUpSession ?? null,
            note: request.note ?? null,
            details: {
              create: request.details.map((detail) => ({
                itemId: detail.itemId,
                selectedOptions: detail.selectedOptions ?? Prisma.JsonNull,
              })),
            },
          },
          include: {
            details: {
              include: {
                serviceItem: true,
              },
            },
          },
        });

        createdRequests.push(created);

        const detailIdByItemId = new Map(
          created.details
            .filter((detail) => detail.itemId)
            .map((detail) => [detail.itemId as string, detail.requestDetailId]),
        );

        const resultsToCreate = request.serviceResults
          .map((result) => {
            const itemId = result.itemId ?? null;
            const detailId =
              itemId && detailIdByItemId.get(itemId)
                ? (detailIdByItemId.get(itemId) ?? null)
                : null;
            if (!detailId) {
              return null;
            }
            return {
              detailId,
              requestId: created.requestId,
              itemId,
              configId: result.configId ?? null,
              indicatorName: result.indicatorName ?? null,
              valueString: result.valueString ?? null,
              valueNumber: result.valueNumber ?? null,
              unit: result.unit ?? null,
              executedAt: result.executedAt ?? null,
            };
          })
          .filter(Boolean) as Prisma.ServiceResultUncheckedCreateInput[];

        if (resultsToCreate.length > 0) {
          await tx.serviceResult.createMany({ data: resultsToCreate });
        }
      }

      await tx.serviceRequest.updateMany({
        where: { requestId: { in: requests.map((r) => r.requestId) } },
        data: { isFollowUpTransferred: true },
      });

      return { transferred: requests.length, requests: createdRequests };
    });
  }

  public async create(
    createData: CreateServiceRequestPayload,
    tx?: Prisma.TransactionClient,
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
          isFollowUpTransferred: createData.isFollowUpTransferred ?? false,
          isPrinted: createData.isPrinted ?? false,
          followUpDate: createData.followUpDate ?? null,
          followUpSession: (createData.followUpSession as Session) ?? null,
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
          isFollowUpTransferred: createData.isFollowUpTransferred ?? false,
          isPrinted: createData.isPrinted ?? false,
          followUpDate: createData.followUpDate ?? null,
          followUpSession: (createData.followUpSession as Session) ?? null,
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
    tx?: Prisma.TransactionClient,
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
            clinic: true,
            doctor: true,
            followUp: true,
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

  public async createShell(recordId: string, doctorId: string) {
    return await prisma.serviceRequest.create({
      data: {
        recordId,
        orderingDoctorId: doctorId,
        diagnoses: Prisma.JsonNull,
      },
    });
  }

  public async upsert(
    payload: CreateServiceRequestPayload & { requestId: string },
    tx?: Prisma.TransactionClient,
  ): Promise<ServiceRequestWithDetails> {
    const run = async (client: Prisma.TransactionClient) => {
      await client.serviceRequest.update({
        where: { requestId: payload.requestId },
        data: {
          orderingDoctorId: payload.orderingDoctorId,
          diagnoses: payload.diagnoses ?? Prisma.JsonNull,
          isPatientRequested: payload.isPatientRequested ?? false,
          receiveResultAtClinic: payload.receiveResultAtClinic ?? false,
          isForFollowUp: payload.isForFollowUp ?? false,
          isFollowUpTransferred: payload.isFollowUpTransferred ?? false,
          isPrinted: payload.isPrinted ?? false,
          followUpDate: payload.followUpDate ?? null,
          followUpSession: (payload.followUpSession as Session) ?? null,
          note: payload.note ?? null,
          updatedAt: new Date(),
        },
      });

      if (payload.diagnoses !== undefined) {
        await client.medicalRecord.update({
          where: { recordId: payload.recordId },
          data: {
            diagnoses: payload.diagnoses ?? Prisma.JsonNull,
          },
        });
      }

      const existingDetails = await client.serviceRequestDetail.findMany({
        where: { requestId: payload.requestId },
        select: { requestDetailId: true, itemId: true },
      });

      const incomingDetails = payload.details ?? [];
      if (incomingDetails.length === 0) {
        await client.serviceResult.deleteMany({
          where: { requestId: payload.requestId },
        });
        await client.serviceRequestDetail.deleteMany({
          where: { requestId: payload.requestId },
        });
      } else {
        const existingByItemId = new Map(
          existingDetails
            .filter((detail) => detail.itemId)
            .map((detail) => [detail.itemId, detail.requestDetailId]),
        );

        const incomingItemIds = new Set(incomingDetails.map((d) => d.itemId));

        const detailIdsToDelete = existingDetails
          .filter(
            (detail) => detail.itemId && !incomingItemIds.has(detail.itemId),
          )
          .map((detail) => detail.requestDetailId);

        if (detailIdsToDelete.length > 0) {
          await client.serviceResult.deleteMany({
            where: {
              requestId: payload.requestId,
              detailId: { in: detailIdsToDelete },
            },
          });
          await client.serviceRequestDetail.deleteMany({
            where: { requestDetailId: { in: detailIdsToDelete } },
          });
        }

        for (const detail of incomingDetails) {
          const existingId = existingByItemId.get(detail.itemId);
          if (existingId) {
            await client.serviceRequestDetail.update({
              where: { requestDetailId: existingId },
              data: {
                selectedOptions: detail.selectedOptions ?? Prisma.JsonNull,
              },
            });
          } else {
            await client.serviceRequestDetail.create({
              data: {
                requestId: payload.requestId,
                itemId: detail.itemId,
                selectedOptions: detail.selectedOptions ?? Prisma.JsonNull,
              },
            });
          }
        }
      }
      return await client.serviceRequest.findUniqueOrThrow({
        where: { requestId: payload.requestId },
        include: {
          details: {
            include: { serviceItem: true },
          },
        },
      });
    };

    if (tx) {
      return await run(tx);
    }

    return await prisma.$transaction(async (transactionClient) =>
      run(transactionClient),
    );
  }

  public async findPrintStatus(requestId: string) {
    return await prisma.serviceRequest.findUnique({
      where: { requestId },
      select: { isPrinted: true, isFollowUpTransferred: true },
    });
  }

  public async updatePrintedSatus(requestId: string, isPrinted: boolean) {
    return await prisma.serviceRequest.update({
      where: { requestId },
      data: {
        isPrinted,
      },
    });
  }

  public async findById(requestId: string) {
    return await prisma.serviceRequest.findUnique({
      where: { requestId },
      select: {
        medicalRecord: { select: { clinicId: true } },
        isPrinted: true,
      },
    });
  }
}
