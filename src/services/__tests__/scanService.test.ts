import { describe, it, expect } from "vitest";
import { Lock } from "lucide-react";
import { groupChecksByCategory, CATEGORY_ORDER } from "../scanService";
import type { ScanCheck } from "../scanService";

function makeCheck(id: string, category: ScanCheck["category"]): ScanCheck {
  return {
    id,
    title: id,
    value: "test",
    summary: "test",
    learnMore: "test",
    glossary: "test",
    status: "safe",
    icon: Lock,
    category,
  };
}

describe("groupChecksByCategory", () => {
  it("groups checks under their assigned category", () => {
    const checks = [makeCheck("https", "connection"), makeCheck("domain-age", "domain")];
    const groups = groupChecksByCategory(checks);

    const connectionGroup = groups.find((g) => g.category === "connection");
    const domainGroup = groups.find((g) => g.category === "domain");

    expect(connectionGroup?.checks.map((c) => c.id)).toEqual(["https"]);
    expect(domainGroup?.checks.map((c) => c.id)).toEqual(["domain-age"]);
  });

  it("omits categories with no checks rather than returning an empty group", () => {
    const checks = [makeCheck("https", "connection")];
    const groups = groupChecksByCategory(checks);

    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe("connection");
  });

  it("always follows the fixed CATEGORY_ORDER regardless of input order", () => {
    const checks = [
      makeCheck("malware-reputation", "reputation"),
      makeCheck("https", "connection"),
      makeCheck("security-headers", "technical"),
      makeCheck("domain-age", "domain"),
    ];
    const groups = groupChecksByCategory(checks);
    const orderedCategories = groups.map((g) => g.category);
    const expectedOrder = CATEGORY_ORDER.filter((c) => orderedCategories.includes(c));

    expect(orderedCategories).toEqual(expectedOrder);
  });
});
