import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRecordFileFresh } from "../../src/modules/shared/services/shared.service";

const at = (time: string) => new Date(`2026-11-21T${time}Z`);

describe("isRecordFileFresh", () => {
  it("is fresh when nothing changed after rendering started", () => {
    assert.equal(isRecordFileFresh(at("04:00:00"), at("04:00:09"), at("04:00:02")), true);
  });

  it("is stale when the record changed while the file was being rendered", () => {
    assert.equal(isRecordFileFresh(at("04:00:05"), at("04:00:09"), at("04:00:02")), false);
  });

  it("falls back to the file time for files without a producing job", () => {
    assert.equal(isRecordFileFresh(at("04:00:05"), at("04:00:09"), null), true);
    assert.equal(isRecordFileFresh(at("04:00:10"), at("04:00:09"), null), false);
  });
});
