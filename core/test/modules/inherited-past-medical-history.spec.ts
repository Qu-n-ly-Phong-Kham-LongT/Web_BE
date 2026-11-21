import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickInheritedPastMedicalHistory } from "../../src/modules/clinical-examination/repositories/clinical-examination.repository";

describe("pickInheritedPastMedicalHistory", () => {
  it("copies past history from the latest earlier record", () => {
    assert.equal(
      pickInheritedPastMedicalHistory(["Tăng huyết áp", "Đái tháo đường"]),
      "Tăng huyết áp",
    );
  });

  it("skips earlier records whose past history is blank", () => {
    assert.equal(
      pickInheritedPastMedicalHistory(["   ", "\n", "Hen suyễn"]),
      "Hen suyễn",
    );
  });

  it("leaves past history empty when no earlier record has one", () => {
    assert.equal(pickInheritedPastMedicalHistory([]), null);
    assert.equal(pickInheritedPastMedicalHistory([" ", ""]), null);
  });
});
