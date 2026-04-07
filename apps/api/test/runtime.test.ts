import test from "node:test";
import assert from "node:assert/strict";

import { requiresExplicitDevBootstrapIdentity } from "../src/lib/runtime.ts";

const request = new Request("http://localhost:8787/v1/dev/bootstrap", {
  method: "POST",
});

test("dev bootstrap requires explicit identity by default", () => {
  assert.equal(
    requiresExplicitDevBootstrapIdentity(request, {} as Env),
    true,
  );
});

test("dev bootstrap explicit identity requirement can be disabled via env", () => {
  assert.equal(
    requiresExplicitDevBootstrapIdentity(request, {
      SKYGEMS_REQUIRE_EXPLICIT_DEV_BOOTSTRAP_IDENTITY: "false",
    } as Env),
    false,
  );
});
