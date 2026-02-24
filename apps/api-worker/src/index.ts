import { createRequestContext, createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import { createStructuredLogger } from "@realtyos/observability";
import type { Env } from "./env.js";
import { Router } from "./router.js";
import { withErrorHandler } from "./middleware/error-handler.js";
import { handleCors, withCorsHeaders } from "./middleware/cors.js";
import { resolveAuth } from "./middleware/auth.js";

// ── Auth handlers ──
import {
  getSession,
  selectClient,
  logout,
  residentLogin,
  passwordResetRequest,
  passwordResetVerify,
  passwordResetComplete,
  mfaEnrollTotp,
  mfaChallenge,
  mfaVerify,
  createServiceAccount,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  oidcLogin,
  oidcCallback,
} from "./handlers/auth.js";

// ── Client handlers ──
import { createClient, listClients, getClient } from "./handlers/clients.js";

// ── Config handlers ──
import { getResolvedConfig } from "./handlers/config.js";

// ── Property handlers ──
import {
  createProperty,
  listProperties,
  getProperty,
  updateProperty,
  createUnit,
  listUnits,
  getUnit,
  updateUnit,
} from "./handlers/properties.js";

// ── Lease handlers ──
import {
  createLease,
  listLeases,
  getLease,
  transitionLease,
  listResidentLeases,
  getResidentLease,
} from "./handlers/leases.js";

// ── Maintenance handlers ──
import {
  submitMaintenanceRequest,
  listResidentMaintenanceRequests,
  listMaintenanceRequests,
  assignMaintenanceRequest,
} from "./handlers/maintenance.js";

// ── File handlers ──
import { getUploadUrl, completeUpload, getDownloadUrl } from "./handlers/files.js";

// ── Finance handlers ──
import {
  getLedger,
  getBalances,
  postManualCharge,
  recordManualPayment,
  allocatePayment,
  getPolicies,
  publishPolicy,
} from "./handlers/finance.js";

// ── Build router ──

function buildRouter(): Router {
  const r = new Router();

  // Auth: session
  r.get("/v1/auth/session", getSession);
  r.post("/v1/auth/select-client", selectClient);
  r.post("/v1/auth/logout", logout);

  // Auth: resident
  r.post("/v1/auth/resident/login", residentLogin);
  r.post("/v1/auth/resident/password-reset/request", passwordResetRequest);
  r.post("/v1/auth/resident/password-reset/verify", passwordResetVerify);
  r.post("/v1/auth/resident/password-reset/complete", passwordResetComplete);

  // Auth: MFA
  r.post("/v1/auth/mfa/enroll/totp", mfaEnrollTotp);
  r.post("/v1/auth/mfa/challenge", mfaChallenge);
  r.post("/v1/auth/mfa/verify", mfaVerify);

  // Auth: API keys
  r.post("/v1/auth/service-accounts", createServiceAccount);
  r.post("/v1/auth/api-keys", createApiKey);
  r.get("/v1/auth/api-keys", listApiKeys);
  r.delete("/v1/auth/api-keys/:id", revokeApiKey);

  // Auth: OIDC
  r.get("/v1/auth/oidc/:audience/login", oidcLogin);
  r.get("/v1/auth/oidc/:audience/callback", oidcCallback);

  // Command: clients
  r.post("/v1/command/clients", createClient);
  r.get("/v1/command/clients", listClients);
  r.get("/v1/command/clients/:clientId", getClient);

  // Config
  r.get("/v1/client/config/resolved", getResolvedConfig);

  // Properties & units
  r.post("/v1/properties", createProperty);
  r.get("/v1/properties", listProperties);
  r.get("/v1/properties/:propertyId", getProperty);
  r.patch("/v1/properties/:propertyId", updateProperty);
  r.post("/v1/properties/:propertyId/units", createUnit);
  r.get("/v1/properties/:propertyId/units", listUnits);
  r.get("/v1/units/:unitId", getUnit);
  r.patch("/v1/units/:unitId", updateUnit);

  // Leases
  r.post("/v1/leases", createLease);
  r.get("/v1/leases", listLeases);
  r.get("/v1/leases/:leaseId", getLease);
  r.post("/v1/leases/:leaseId/transitions", transitionLease);
  r.get("/v1/portal/leases", listResidentLeases);
  r.get("/v1/portal/leases/:leaseId", getResidentLease);

  // Maintenance
  r.post("/v1/portal/maintenance-requests", submitMaintenanceRequest);
  r.get("/v1/portal/maintenance-requests", listResidentMaintenanceRequests);
  r.get("/v1/maintenance-requests", listMaintenanceRequests);
  r.post("/v1/maintenance-requests/:requestId/assign", assignMaintenanceRequest);

  // Files
  r.post("/v1/files/upload-url", getUploadUrl);
  r.post("/v1/files/:fileId/complete", completeUpload);
  r.get("/v1/files/:fileId/download-url", getDownloadUrl);

  // Finance
  r.get("/v1/finance/ledger", getLedger);
  r.get("/v1/finance/balances", getBalances);
  r.post("/v1/finance/charges/manual", postManualCharge);
  r.post("/v1/finance/payments/manual", recordManualPayment);
  r.post("/v1/finance/payments/:paymentId/allocate", allocatePayment);
  r.get("/v1/finance/policies", getPolicies);
  r.put("/v1/finance/policies/:kind", publishPolicy);

  return r;
}

const router = buildRouter();

export default {
  async fetch(request: Request, env: Env, _execCtx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    const ctx = createRequestContext(request);

    const logger = createStructuredLogger({
      service: "api-worker",
      correlationId: ctx.correlationId,
    });

    logger.info("Incoming request", { path: ctx.path, method: ctx.method });

    // Auth resolution
    const { errorResponse: authError } = await resolveAuth(request, env, ctx);
    if (authError) return withCorsHeaders(authError, request);

    // Route matching
    const match = router.match(request.method, request.url);
    if (!match) {
      const { status, body } = createErrorResponse(
        ErrorCode.NOT_FOUND,
        `No route matched ${ctx.method} ${ctx.path}`,
        ctx.correlationId,
      );
      return withCorsHeaders(
        Response.json({ error: body }, { status }),
        request,
      );
    }

    // Execute handler with error wrapping
    const handler = withErrorHandler(match.handler);
    const response = await handler(request, match.params, env, ctx);

    logger.info("Request completed", {
      path: ctx.path,
      method: ctx.method,
      status: response.status,
      durationMs: Date.now() - ctx.startTime,
    });

    return withCorsHeaders(response, request);
  },
};
