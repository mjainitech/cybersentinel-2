import { describe, it, expect, afterEach } from "vitest";
import { addBookmark, removeBookmark, listBookmarksForUser, isBookmarked } from "../threatBookmarkStore";

// These run against the real JSON-file store (consistent with this
// project's architecture — there's no separate test database). Every
// test uses uniquely-prefixed test user IDs and cleans up afterward
// so this doesn't leave permanent clutter in the data file.
const USER_A = "test-user-bookmark-a";
const USER_B = "test-user-bookmark-b";

async function cleanup() {
  for (const userId of [USER_A, USER_B]) {
    const bookmarks = await listBookmarksForUser(userId);
    for (const b of bookmarks) {
      await removeBookmark(userId, b.threatId, b.threatKind);
    }
  }
}

describe("threatBookmarkStore", () => {
  afterEach(cleanup);

  it("adds a bookmark and can retrieve it for that user", async () => {
    await addBookmark(USER_A, { threatId: "mfa-fatigue-attacks", threatKind: "curated", title: "MFA Fatigue", category: "social-engineering" });
    const bookmarks = await listBookmarksForUser(USER_A);
    expect(bookmarks.some((b) => b.threatId === "mfa-fatigue-attacks")).toBe(true);
  });

  it("does not let one user see another user's bookmarks (authorization scoping)", async () => {
    await addBookmark(USER_A, { threatId: "ransomware-as-a-service", threatKind: "curated", title: "Ransomware", category: "ransomware" });
    const userBBookmarks = await listBookmarksForUser(USER_B);
    expect(userBBookmarks.some((b) => b.threatId === "ransomware-as-a-service")).toBe(false);
  });

  it("is idempotent — bookmarking the same threat twice does not create a duplicate", async () => {
    await addBookmark(USER_A, { threatId: "qr-code-phishing", threatKind: "curated", title: "Quishing", category: "phishing" });
    await addBookmark(USER_A, { threatId: "qr-code-phishing", threatKind: "curated", title: "Quishing", category: "phishing" });
    const bookmarks = await listBookmarksForUser(USER_A);
    expect(bookmarks.filter((b) => b.threatId === "qr-code-phishing")).toHaveLength(1);
  });

  it("removes a bookmark correctly", async () => {
    await addBookmark(USER_A, { threatId: "sim-swapping", threatKind: "curated", title: "SIM Swapping", category: "identity-theft" });
    expect(await isBookmarked(USER_A, "sim-swapping", "curated")).toBe(true);

    await removeBookmark(USER_A, "sim-swapping", "curated");
    expect(await isBookmarked(USER_A, "sim-swapping", "curated")).toBe(false);
  });

  it("removing a bookmark that doesn't exist returns false rather than throwing", async () => {
    const result = await removeBookmark(USER_A, "nonexistent-threat", "curated");
    expect(result).toBe(false);
  });

  it("distinguishes bookmarks by threatKind — a curated entry and a CVE with the same id string are different", async () => {
    await addBookmark(USER_A, { threatId: "shared-id", threatKind: "curated", title: "Curated", category: "malware" });
    await addBookmark(USER_A, { threatId: "shared-id", threatKind: "cve", title: "CVE", category: "vulnerabilities" });
    const bookmarks = await listBookmarksForUser(USER_A);
    expect(bookmarks.filter((b) => b.threatId === "shared-id")).toHaveLength(2);
  });
});
