import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { getNumberEnv } from "../../src/utils/print-job-queue.util";

const ENV_NAME = "PRINT_JOB_SPEC_NUMBER";

describe("getNumberEnv", () => {
  afterEach(() => {
    delete process.env[ENV_NAME];
  });

  it("returns the fallback when the variable is missing", () => {
    assert.equal(getNumberEnv(ENV_NAME, 7), 7);
  });

  it("floors a valid non-negative number", () => {
    process.env[ENV_NAME] = "3.9";
    assert.equal(getNumberEnv(ENV_NAME, 7), 3);
  });

  it("falls back on negative or non-numeric values", () => {
    process.env[ENV_NAME] = "-1";
    assert.equal(getNumberEnv(ENV_NAME, 7), 7);
    process.env[ENV_NAME] = "abc";
    assert.equal(getNumberEnv(ENV_NAME, 7), 7);
  });
});
