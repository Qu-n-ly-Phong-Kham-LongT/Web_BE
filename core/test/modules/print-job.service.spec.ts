import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrintJobStatus, PrintJobType } from "@prisma/client";
import { PrintJobService } from "../../src/modules/print-job/services/print-job.service";
import type {
  PrintJobRepository,
  PrintJobWithFile,
} from "../../src/modules/print-job/repositories/print-job.repository";
import { BaseError } from "../../src/utils/base-error.util";

const DONE_JOB: PrintJobWithFile = {
  jobId: "job-1",
  type: PrintJobType.MEDICAL_RECORD,
  status: PrintJobStatus.DONE,
  clinicId: "clinic-a",
  fileId: "file-1",
  errorMsg: null,
  createdAt: new Date("2026-11-21T04:25:00Z"),
  finishedAt: new Date("2026-11-21T04:25:07Z"),
  file: { relativePath: "/uploads/MEDICAL_RECORD/ba-1.pdf" },
};

function serviceWith(job: PrintJobWithFile | null) {
  const repository = {
    findWithFile: async () => job,
  } as unknown as PrintJobRepository;
  return new PrintJobService(repository);
}

function isNotFound(error: unknown) {
  return error instanceof BaseError && error.statusCode === 404;
}

describe("PrintJobService.getJobStatus", () => {
  beforeEach(() => {
    process.env.BASE_URL = "https://api.example.test/";
  });

  afterEach(() => {
    delete process.env.BASE_URL;
  });

  it("returns done job with file url", async () => {
    const result = await serviceWith(DONE_JOB).getJobStatus("job-1", "clinic-a");

    assert.equal(result.status, PrintJobStatus.DONE);
    assert.equal(result.fileId, "file-1");
    assert.equal(
      result.fileUrl,
      "https://api.example.test/uploads/MEDICAL_RECORD/ba-1.pdf",
    );
  });

  it("returns a pending job without file url", async () => {
    const pending = { ...DONE_JOB, status: PrintJobStatus.PENDING, fileId: null, file: null, finishedAt: null };

    const result = await serviceWith(pending).getJobStatus("job-1", "clinic-a");

    assert.equal(result.status, PrintJobStatus.PENDING);
    assert.equal(result.fileUrl, null);
  });

  it("hides job of another clinic", async () => {
    await assert.rejects(
      serviceWith(DONE_JOB).getJobStatus("job-1", "clinic-b"),
      isNotFound,
    );
  });

  it("returns 404 for an unknown job", async () => {
    await assert.rejects(serviceWith(null).getJobStatus("missing", "clinic-a"), isNotFound);
  });
});
