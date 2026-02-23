import { describe, it, expect } from "vitest";
import { canApprove, approve, reject, isFullyApproved } from "../engine.js";
import type { ChangeRequest } from "../types.js";
import { ChangeRequestStatus } from "../types.js";

function makeRequest(overrides?: Partial<ChangeRequest>): ChangeRequest {
  return {
    requestId: "req-1",
    clientId: "client-1",
    actionType: "update-property",
    policyId: "policy-1",
    makerId: "maker-1",
    status: ChangeRequestStatus.PENDING_APPROVAL,
    payload: { foo: "bar" },
    steps: [
      { stepId: "step-1", approvals: [], status: "pending" },
    ],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    ...overrides,
  };
}

describe("canApprove", () => {
  it("should enforce separation of duty — maker cannot approve", () => {
    const request = makeRequest();
    const result = canApprove(request, "maker-1", "admin");
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("separation of duty");
  });

  it("should allow a different user to approve", () => {
    const request = makeRequest();
    const result = canApprove(request, "approver-1", "admin");
    expect(result.eligible).toBe(true);
  });

  it("should reject approval on non-pending request", () => {
    const request = makeRequest({ status: ChangeRequestStatus.APPROVED });
    const result = canApprove(request, "approver-1", "admin");
    expect(result.eligible).toBe(false);
  });

  it("should reject duplicate approver on same step", () => {
    const request = makeRequest({
      steps: [
        {
          stepId: "step-1",
          approvals: [
            { approverId: "approver-1", approvedAt: new Date().toISOString(), role: "admin" },
          ],
          status: "pending",
        },
        { stepId: "step-2", approvals: [], status: "pending" },
      ],
    });
    const result = canApprove(request, "approver-1", "admin");
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("already approved");
  });
});

describe("approve", () => {
  it("should approve a single-step request", () => {
    const request = makeRequest();
    const updated = approve(request, "approver-1", "admin");
    expect(updated.steps[0]!.approvals).toHaveLength(1);
    expect(updated.steps[0]!.approvals[0]!.approverId).toBe("approver-1");
    expect(updated.status).toBe(ChangeRequestStatus.APPROVED);
  });

  it("should handle multi-step approval", () => {
    const request = makeRequest({
      steps: [
        { stepId: "step-1", approvals: [], status: "pending" },
        { stepId: "step-2", approvals: [], status: "pending" },
      ],
    });

    const afterFirst = approve(request, "approver-1", "admin");
    // First step has an approval but second step is still empty
    expect(afterFirst.steps[0]!.approvals).toHaveLength(1);
    // Not fully approved yet because step-2 has no approvals
    expect(afterFirst.status).toBe(ChangeRequestStatus.PENDING_APPROVAL);

    const afterSecond = approve(afterFirst, "approver-2", "manager");
    expect(afterSecond.steps[1]!.approvals).toHaveLength(1);
    expect(isFullyApproved(afterSecond)).toBe(true);
    expect(afterSecond.status).toBe(ChangeRequestStatus.APPROVED);
  });

  it("should throw when maker tries to approve", () => {
    const request = makeRequest();
    expect(() => approve(request, "maker-1", "admin")).toThrow(
      "separation of duty",
    );
  });
});

describe("reject", () => {
  it("should reject a pending request", () => {
    const request = makeRequest();
    const updated = reject(request, "approver-1", "Looks wrong");
    expect(updated.status).toBe(ChangeRequestStatus.REJECTED);
    expect(updated.steps[0]!.status).toBe("rejected");
  });

  it("should throw when rejecting non-pending request", () => {
    const request = makeRequest({ status: ChangeRequestStatus.APPROVED });
    expect(() => reject(request, "approver-1", "reason")).toThrow(
      "not pending",
    );
  });
});

describe("isFullyApproved", () => {
  it("should return false when steps have no approvals", () => {
    const request = makeRequest();
    expect(isFullyApproved(request)).toBe(false);
  });

  it("should return true when all steps have approvals", () => {
    const request = makeRequest({
      steps: [
        {
          stepId: "step-1",
          approvals: [
            { approverId: "a1", approvedAt: new Date().toISOString(), role: "admin" },
          ],
          status: "approved",
        },
      ],
    });
    expect(isFullyApproved(request)).toBe(true);
  });
});
