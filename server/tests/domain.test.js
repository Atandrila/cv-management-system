import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRule, positionAccessible } from "../src/utils/domain.js";

test("numeric access rules use numeric comparison", () => {
  assert.equal(evaluateRule({ operator: "GREATER_THAN", expected: "7" }, "7.5"), true);
  assert.equal(evaluateRule({ operator: "LESS_OR_EQUAL", expected: "7" }, "7.5"), false);
});

test("boolean and text access rules are evaluated", () => {
  assert.equal(evaluateRule({ operator: "IS_TRUE" }, "true"), true);
  assert.equal(evaluateRule({ operator: "CONTAINS", expected: "advanced" }, "Advanced presenter"), true);
});

test("restricted positions require all rules", () => {
  const position = { isPublic: false, accessRules: [{ attributeId: "score", operator: "GREATER_OR_EQUAL", expected: "7" }, { attributeId: "remote", operator: "IS_TRUE", expected: "" }] };
  const values = [{ attributeId: "score", value: "7.5" }, { attributeId: "remote", value: "true" }];
  assert.equal(positionAccessible(position, values, { roles: [] }), true);
  assert.equal(positionAccessible(position, [{ attributeId: "score", value: "6" }], { roles: [] }), false);
});
