export const hasRole = (user, ...roles) => user?.roles?.some((item) => roles.includes(item.role.name));
export const cleanText = (value, max = 5000) => String(value ?? "").trim().slice(0, max);
export const asArray = (value) => Array.isArray(value) ? value : [];
export const unique = (values) => [...new Set(values.filter(Boolean))];

export function conflict(response, entity) {
  return response.status(409).json({ success: false, code: "VERSION_CONFLICT", message: `${entity} was changed in another session. Reload and try again.` });
}

export function evaluateRule(rule, rawValue) {
  const value = String(rawValue ?? "");
  const expected = String(rule.expected ?? "");
  const numericValue = Number(value);
  const numericExpected = Number(expected);
  switch (rule.operator) {
    case "EQUALS": return value.toLowerCase() === expected.toLowerCase();
    case "NOT_EQUALS": return value.toLowerCase() !== expected.toLowerCase();
    case "CONTAINS": return value.toLowerCase().includes(expected.toLowerCase());
    case "GREATER_THAN": return numericValue > numericExpected;
    case "GREATER_OR_EQUAL": return numericValue >= numericExpected;
    case "LESS_THAN": return numericValue < numericExpected;
    case "LESS_OR_EQUAL": return numericValue <= numericExpected;
    case "IS_TRUE": return value === "true";
    case "IS_FALSE": return value !== "true";
    default: return false;
  }
}

export function positionAccessible(position, values, user) {
  if (!user) return position.isPublic;
  if (hasRole(user, "RECRUITER", "ADMIN")) return true;
  if (position.isPublic) return true;
  const valueMap = new Map(values.map((item) => [item.attributeId, item.value]));
  return position.accessRules.every((rule) => evaluateRule(rule, valueMap.get(rule.attributeId)));
}

export function markdownToSafeHtml(markdown) {
  const escaped = cleanText(markdown, 20000)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return escaped
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}
