import type { ChangeRequest } from "./types.js";
import { ChangeRequestStatus } from "./types.js";

export interface CanApproveResult {
  eligible: boolean;
  reason?: string;
}

export function canApprove(
  request: ChangeRequest,
  approverId: string,
  role: string,
): CanApproveResult {
  if (request.status !== ChangeRequestStatus.PENDING_APPROVAL) {
    return { eligible: false, reason: "Request is not pending approval" };
  }

  if (request.makerId === approverId) {
    return {
      eligible: false,
      reason: "Maker cannot approve their own request (separation of duty)",
    };
  }

  const pendingStep = request.steps.find((s) => s.status === "pending");
  if (!pendingStep) {
    return { eligible: false, reason: "No pending steps" };
  }

  const alreadyApproved = pendingStep.approvals.some(
    (a) => a.approverId === approverId,
  );
  if (alreadyApproved) {
    return {
      eligible: false,
      reason: "Approver has already approved this step",
    };
  }

  return { eligible: true };
}

export function approve(
  request: ChangeRequest,
  approverId: string,
  role: string,
): ChangeRequest {
  const check = canApprove(request, approverId, role);
  if (!check.eligible) {
    throw new Error(check.reason ?? "Cannot approve");
  }

  const updated = structuredClone(request);

  const pendingStep = updated.steps.find((s) => s.status === "pending");
  if (!pendingStep) {
    throw new Error("No pending steps");
  }

  pendingStep.approvals.push({
    approverId,
    approvedAt: new Date().toISOString(),
    role,
  });

  // Mark the step as approved once it has at least one approval.
  // In a production system the required count would come from the policy;
  // here each approval satisfies the step.
  pendingStep.status = "approved";

  if (isFullyApproved(updated)) {
    updated.status = ChangeRequestStatus.APPROVED;
  }

  return updated;
}

export function reject(
  request: ChangeRequest,
  approverId: string,
  reason: string,
): ChangeRequest {
  if (request.status !== ChangeRequestStatus.PENDING_APPROVAL) {
    throw new Error("Request is not pending approval");
  }

  const updated = structuredClone(request);

  const pendingStep = updated.steps.find((s) => s.status === "pending");
  if (pendingStep) {
    pendingStep.status = "rejected";
  }

  updated.status = ChangeRequestStatus.REJECTED;
  return updated;
}

export function isFullyApproved(request: ChangeRequest): boolean {
  return request.steps.every((step) => step.status === "approved");
}
