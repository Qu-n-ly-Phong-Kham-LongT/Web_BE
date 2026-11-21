import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import {
  ClinicalExaminationRepository,
  pickInheritedPastMedicalHistory,
} from "../../src/modules/clinical-examination/repositories/clinical-examination.repository";
import { MedicalRecordService } from "../../src/modules/medical-record/services/medical-record.service";

type FindManyArgs = {
  where: Record<string, unknown>;
  orderBy: unknown;
  take: number;
};

function repositoryReturning(histories: Array<string | null>) {
  const calls: FindManyArgs[] = [];
  const database = {
    clinicalExamination: {
      findMany: async (args: FindManyArgs) => {
        calls.push(args);
        return histories.map((pastMedicalHistory) => ({ pastMedicalHistory }));
      },
    },
  } as unknown as Prisma.TransactionClient;
  return { repository: new ClinicalExaminationRepository(database), calls };
}

describe("pickInheritedPastMedicalHistory", () => {
  it("takes the first non-blank history", () => {
    assert.equal(pickInheritedPastMedicalHistory(["Tăng huyết áp", "Hen"]), "Tăng huyết áp");
  });

  it("skips blank histories", () => {
    assert.equal(pickInheritedPastMedicalHistory(["   ", "\n", "Hen suyễn"]), "Hen suyễn");
  });

  it("returns null when nothing is usable", () => {
    assert.equal(pickInheritedPastMedicalHistory([]), null);
    assert.equal(pickInheritedPastMedicalHistory([" ", null]), null);
  });
});

describe("ClinicalExaminationRepository.findInheritedPastMedicalHistory", () => {
  it("copies past history from the latest earlier record of the same patient and clinic", async () => {
    const before = new Date("2026-11-19T17:00:00Z");
    const { repository, calls } = repositoryReturning([" ", "Đái tháo đường"]);

    const history = await repository.findInheritedPastMedicalHistory("patient-1", "clinic-1", before);

    assert.equal(history, "Đái tháo đường");
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].where.medicalRecord, {
      patientId: "patient-1",
      clinicId: "clinic-1",
      isDeleted: false,
      createdAt: { lt: before },
    });
    assert.deepEqual(calls[0].orderBy, { medicalRecord: { createdAt: "desc" } });
    assert.ok(calls[0].take > 0);
  });
});

describe("MedicalRecordService past history day boundary", () => {
  it("looks only before the Vietnam start of the backdated record's day", async () => {
    const service = new MedicalRecordService();
    const seen: Date[] = [];
    Object.assign(service, {
      clinicalExaminationRepository: {
        findInheritedPastMedicalHistory: async (_p: string, _c: string, before: Date) => {
          seen.push(before);
          return "TC";
        },
      },
    });

    const history = await (
      service as unknown as {
        findInheritedPastMedicalHistory: (patientId: string, clinicId: string, recordDay: Date) => Promise<string | null>;
      }
    ).findInheritedPastMedicalHistory("patient-1", "clinic-1", new Date("2026-11-20T02:00:00+07:00"));

    assert.equal(history, "TC");
    assert.equal(seen[0]?.toISOString(), "2026-11-19T17:00:00.000Z");
  });
});
