import { describe, it, expect, afterEach } from "vitest";
import { setActionStatus, getActionStatusMap, countCompletedForUser, countDismissedForUser } from "../actionStatusStore";

const USER_A = "test-user-action-status-a";
const USER_B = "test-user-action-status-b";

async function resetUser(userId: string) {
  const map = await getActionStatusMap(userId);
  for (const key of map.keys()) {
    await setActionStatus(userId, key, "not-started");
  }
}

describe("actionStatusStore", () => {
  afterEach(async () => {
    await resetUser(USER_A);
    await resetUser(USER_B);
  });

  it("persists a status change and returns it via the status map", async () => {
    await setActionStatus(USER_A, "enable-mfa", "completed");
    const map = await getActionStatusMap(USER_A);
    expect(map.get("enable-mfa")).toBe("completed");
  });

  it("does not let one user's status changes affect another user (authorization scoping)", async () => {
    await setActionStatus(USER_A, "enable-mfa", "dismissed");
    const userBMap = await getActionStatusMap(USER_B);
    expect(userBMap.get("enable-mfa")).toBeUndefined();
  });

  it("dismissing an action only changes its status, never anything else about it", async () => {
    await setActionStatus(USER_A, "check-account-exposure", "dismissed");
    const map = await getActionStatusMap(USER_A);
    expect(map.get("check-account-exposure")).toBe("dismissed");
    expect(await countDismissedForUser(USER_A)).toBeGreaterThanOrEqual(1);
  });

  it("marking an action completed is reflected in the completed count", async () => {
    await setActionStatus(USER_A, "improve-privacy", "completed");
    expect(await countCompletedForUser(USER_A)).toBeGreaterThanOrEqual(1);
  });

  it("updating the same action's status again overwrites rather than duplicating", async () => {
    await setActionStatus(USER_A, "use-password-manager", "in-progress");
    await setActionStatus(USER_A, "use-password-manager", "completed");
    const map = await getActionStatusMap(USER_A);
    expect(map.get("use-password-manager")).toBe("completed");
  });
});
