import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database.config";

export const followUpListSelect = {
  followUpId: true,
  appointmentDate: true,
  session: true,
  reason: true,
  medicalRecord: {
    select: {
      recordId: true,
      recordCode: true,
      diagnoses: true,
      diagnosisNote: true,
      patient: {
        select: {
          patientId: true,
          patientCode: true,
          fullName: true,
          gender: true,
          dob: true,
          phone: true,
          email: true,
        },
      },
      prescription: {
        select: {
          prescriptionId: true,
          prescriptionCode: true,
          status: true,
          totalPrice: true,
          isDispensed: true,
          details: {
            select: {
              detailId: true,
              unit: true,
              quantity: true,
              frequencyPerDay: true,
              quantityPerTime: true,
              daysToTake: true,
              administrationRoute: true,
              timing: true,
              note: true,
              medicine: {
                select: {
                  medicineId: true,
                  medicineName: true,
                  activeIngredient: true,
                },
              },
            },
          },
        },
      },
      serviceRequests: {
        where: {
          isForFollowUp: true,
        },
        select: {
          requestId: true,
          requestCode: true,
          diagnoses: true,
          diagnosisNote: true,
          isFollowUpTransferred: true,
          followUpDate: true,
          followUpSession: true,
          note: true,
          details: {
            select: {
              requestDetailId: true,
              selectedOptions: true,
              serviceItem: {
                select: {
                  itemId: true,
                  itemCode: true,
                  name: true,
                  basePrice: true,
                  unit: true,
                  specimen: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.FollowUpSelect;

export type FollowUpListRecord = Prisma.FollowUpGetPayload<{
  select: typeof followUpListSelect;
}>;

export class FollowUpRepository {
  public async findByClinicAndDateRange(params: {
    clinicId: string;
    startDate: Date;
    endDate: Date;
    page: number;
    limit: number;
  }): Promise<{ items: FollowUpListRecord[]; totalItems: number }> {
    const { clinicId, startDate, endDate, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.FollowUpWhereInput = {
      appointmentDate: {
        gte: startDate,
        lte: endDate,
      },
      medicalRecord: {
        is: {
          isDeleted: false,
          clinicId,
          patient: {
            is: {
              isDeleted: false,
            },
          },
        },
      },
    };

    const [totalItems, items] = await Promise.all([
      prisma.followUp.count({ where }),
      prisma.followUp.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { appointmentDate: "asc" },
          { session: "asc" },
          { followUpId: "asc" },
        ],
        select: followUpListSelect,
      }),
    ]);

    return {
      items,
      totalItems,
    };
  }
}
