import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrescriptionStatus } from "@prisma/client";
import { resolvePrescriptionPrintAction } from "../../src/modules/prescriptions/services/prescription.service";

describe("resolvePrescriptionPrintAction", () => {
  it("renders a draft prescription", () => {
    assert.equal(resolvePrescriptionPrintAction(PrescriptionStatus.Draft, false), "render");
    assert.equal(resolvePrescriptionPrintAction(PrescriptionStatus.Draft, true), "render");
  });

  it("printing an issued prescription with a file returns the existing file", () => {
    assert.equal(resolvePrescriptionPrintAction(PrescriptionStatus.Issued, true), "reuse");
  });

  it("rejects an issued prescription without a file", () => {
    assert.equal(resolvePrescriptionPrintAction(PrescriptionStatus.Issued, false), "reject");
  });

  it("rejects a prescription without status", () => {
    assert.equal(resolvePrescriptionPrintAction(null, true), "reject");
  });

  it("rejects a cancelled prescription", () => {
    assert.equal(resolvePrescriptionPrintAction(PrescriptionStatus.Cancelled, true), "reject");
  });
});
