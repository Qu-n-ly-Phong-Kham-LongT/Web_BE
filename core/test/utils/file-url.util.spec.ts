import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveFileUrl } from "../../src/utils/file-url.util";

describe("resolveFileUrl", () => {
  afterEach(() => {
    delete process.env.BASE_URL;
  });

  it("returns null without a path", () => {
    assert.equal(resolveFileUrl(null), null);
  });

  it("returns the relative path when BASE_URL is unset", () => {
    assert.equal(resolveFileUrl("/uploads/a.pdf"), "/uploads/a.pdf");
  });

  it("joins BASE_URL without doubling slashes", () => {
    process.env.BASE_URL = "https://api.example.test//";
    assert.equal(resolveFileUrl("/uploads/a.pdf"), "https://api.example.test/uploads/a.pdf");
  });
});
