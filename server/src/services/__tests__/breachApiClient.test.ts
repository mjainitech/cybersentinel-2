import { describe, it, expect } from "vitest";
import { mapDataClasses } from "../breachApiClient";

describe("mapDataClasses", () => {
  it("maps known HIBP DataClasses to our ExposureCategory set", () => {
    const result = mapDataClasses(["Email addresses", "Passwords", "Phone numbers"]);
    expect(result).toContain("email");
    expect(result).toContain("password");
    expect(result).toContain("phone");
  });

  it("is case-insensitive", () => {
    const result = mapDataClasses(["EMAIL ADDRESSES", "passwords"]);
    expect(result).toContain("email");
    expect(result).toContain("password");
  });

  it("maps unrecognized categories to 'other' rather than dropping them", () => {
    const result = mapDataClasses(["Some Unknown Future Category"]);
    expect(result).toEqual(["other"]);
  });

  it("deduplicates repeated mappings", () => {
    const result = mapDataClasses(["Physical addresses", "Geographic locations"]);
    expect(result).toEqual(["location"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(mapDataClasses([])).toEqual([]);
  });
});
