import * as Contracts from "@realtyos/contracts-api";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RouteDoc {
    method: HttpMethod;
    path: string;
    summary: string;
    description?: string;
    requestBodySchema?: string;
    querySchema?: string;
    responseSchema?: string;
    statusCode?: number;
    /** OpenAPI tags for grouping */
    tags?: string[];
    /** Whether to include security scheme requirement. True by default for /v1/ routes. */
    secured?: boolean;
    /** Additional OpenAPI parameters (path params, etc.) */
    parameters?: Array<{
        name: string;
        in: "path" | "query" | "header";
        required?: boolean;
        description?: string;
        schema?: Record<string, unknown>;
    }>;
}

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

const AUTH_ROUTES: RouteDoc[] = [
    // ─── Authentication ──────────────────────────────────────────────────
    {
        method: "post",
        path: "/v1/auth/login",
        summary: "Initiate authentication",
        description: "Start the login flow. For OIDC: returns the authorization URL. For password+phone (resident): validates credentials and returns a session.",
        tags: ["auth"],
        secured: false,
    },
    {
        method: "post",
        path: "/v1/auth/callback",
        summary: "OIDC callback",
        description: "Handle the OIDC provider callback after user authenticates. Exchanges the authorization code for tokens and creates a session.",
        tags: ["auth"],
        secured: false,
    },
    {
        method: "post",
        path: "/v1/auth/refresh",
        summary: "Refresh authentication token",
        description: "Exchange a valid session for a new access token. The session must not be revoked or expired.",
        tags: ["auth"],
        secured: true,
    },
    {
        method: "get",
        path: "/v1/auth/whoami",
        summary: "Get current identity",
        description: "Returns the authenticated user's identity, active client, roles, scopes, audience, MFA level, and session info.",
        tags: ["auth"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/auth/logout",
        summary: "Log out",
        description: "Revoke the current session and invalidate all associated tokens. The user must re-authenticate after this.",
        tags: ["auth"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/auth/select-client",
        summary: "Select active client (tenant)",
        description: "Switch the active client/tenant context for the session. The user must have an active membership in the target client.",
        tags: ["auth"],
        secured: true,
    },

    // ─── MFA ─────────────────────────────────────────────────────────────
    {
        method: "post",
        path: "/v1/auth/mfa/enroll",
        summary: "Enroll MFA factor",
        description: "Begin enrollment of a new MFA factor (TOTP, WebAuthn, SMS OTP). Returns factor-specific setup data (e.g., TOTP secret, WebAuthn challenge).",
        tags: ["auth-mfa"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/auth/mfa/challenge",
        summary: "Create MFA challenge",
        description: "Initiate an MFA challenge for step-up authentication. Returns a challenge ID and factor-specific data.",
        tags: ["auth-mfa"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/auth/mfa/verify",
        summary: "Verify MFA challenge",
        description: "Submit the user's MFA response to verify the challenge. On success, the session's MFA level is upgraded.",
        tags: ["auth-mfa"],
        secured: true,
    },
    {
        method: "get",
        path: "/v1/auth/mfa/factors",
        summary: "List MFA factors",
        description: "List all active MFA factors enrolled by the current user.",
        tags: ["auth-mfa"],
        secured: true,
    },

    // ─── API Key Management ──────────────────────────────────────────────
    {
        method: "post",
        path: "/v1/auth/api-keys",
        summary: "Create API key",
        description: "Create a new API key for a service account. Requires OWNER or MANAGER role and STRONG MFA. The full key secret is returned only once in the response.",
        tags: ["auth-apikeys"],
        secured: true,
    },
    {
        method: "get",
        path: "/v1/auth/api-keys",
        summary: "List API keys",
        description: "List all API keys for the current client. Secret values are never returned — only prefix, status, scopes, and metadata.",
        tags: ["auth-apikeys"],
        secured: true,
    },
    {
        method: "delete",
        path: "/v1/auth/api-keys/{keyId}",
        summary: "Revoke API key",
        description: "Permanently revoke an API key. Requires OWNER or MANAGER role and STRONG MFA. Revoked keys cannot be restored.",
        tags: ["auth-apikeys"],
        secured: true,
        parameters: [{
            name: "keyId",
            in: "path",
            required: true,
            description: "The API key ID to revoke",
            schema: { type: "string" },
        }],
    },

    // ─── Password Management ─────────────────────────────────────────────
    {
        method: "post",
        path: "/v1/auth/password/reset-request",
        summary: "Request password reset",
        description: "Send a password reset link to the user's registered phone number or email.",
        tags: ["auth-password"],
        secured: false,
    },
    {
        method: "post",
        path: "/v1/auth/password/reset-verify",
        summary: "Verify password reset token",
        description: "Verify the password reset token is valid before allowing the user to set a new password.",
        tags: ["auth-password"],
        secured: false,
    },
    {
        method: "post",
        path: "/v1/auth/password/reset-complete",
        summary: "Complete password reset",
        description: "Set a new password using a verified reset token. Revokes all existing sessions.",
        tags: ["auth-password"],
        secured: false,
    },
    {
        method: "post",
        path: "/v1/auth/password/change",
        summary: "Change password",
        description: "Change the current user's password. Requires the current password and STRONG MFA. Resident audience only.",
        tags: ["auth-password"],
        secured: true,
    },

    // ─── Session Management ──────────────────────────────────────────────
    {
        method: "get",
        path: "/v1/auth/sessions",
        summary: "List active sessions",
        description: "List all active (non-revoked, non-expired) sessions for the current user. Includes device info, audience, and last activity time.",
        tags: ["auth-sessions"],
        secured: true,
    },
    {
        method: "delete",
        path: "/v1/auth/sessions/{sessionId}",
        summary: "Revoke a session",
        description: "Revoke a specific session. Users can only revoke their own sessions.",
        tags: ["auth-sessions"],
        secured: true,
        parameters: [{
            name: "sessionId",
            in: "path",
            required: true,
            description: "The session ID to revoke",
            schema: { type: "string" },
        }],
    },

    // ─── Audit ───────────────────────────────────────────────────────────
    {
        method: "get",
        path: "/v1/auth/audit",
        summary: "List audit events",
        description: "List security audit events for the current client. Requires OWNER, MANAGER, or SUPPORT_ADMIN role. Supports pagination via limit query parameter.",
        tags: ["auth-audit"],
        secured: true,
        parameters: [{
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum number of events to return (default: 50, max: 200)",
            schema: { type: "integer", minimum: 1, maximum: 200 },
        }],
    },
];

// ─── Business Endpoints ──────────────────────────────────────────────────────

const BUSINESS_ROUTES: RouteDoc[] = [
    {
        method: "post",
        path: "/v1/properties",
        summary: "Create property",
        description: "Create a new property (unit, building, or complex). Requires OWNER or MANAGER role.",
        requestBodySchema: "CreatePropertyRequest",
        responseSchema: "PropertyResponse",
        statusCode: 201,
        tags: ["properties"],
        secured: true,
    },
    {
        method: "get",
        path: "/v1/properties",
        summary: "List properties",
        description: "List properties for the current client. Filtered by the user's roles and membership.",
        querySchema: "ListPropertiesRequest",
        responseSchema: "ListPropertiesResponse",
        statusCode: 200,
        tags: ["properties"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/memberships",
        summary: "Create membership",
        description: "Invite a user to a client organization with specific roles. Requires OWNER or MANAGER role.",
        requestBodySchema: "CreateMembershipRequest",
        responseSchema: "MembershipResponse",
        statusCode: 201,
        tags: ["memberships"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/leases",
        summary: "Create lease",
        description: "Create a new lease agreement for a property. Requires OWNER or MANAGER role.",
        requestBodySchema: "CreateLeaseRequest",
        responseSchema: "LeaseResponse",
        statusCode: 201,
        tags: ["leases"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/maintenance/requests",
        summary: "Create maintenance request",
        description: "Submit a maintenance request for a property. Available to all audiences including residents.",
        requestBodySchema: "CreateMaintenanceRequestSchema",
        responseSchema: "MaintenanceRequestResponse",
        statusCode: 201,
        tags: ["maintenance"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/finance/charge-definitions",
        summary: "Create charge definition",
        description: "Define a recurring charge type (e.g., rent, parking, utilities). Requires OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "CreateChargeDefinitionRequest",
        responseSchema: "ChargeDefinitionResponse",
        statusCode: 201,
        tags: ["finance"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/finance/charge-plans",
        summary: "Create charge plan",
        description: "Create a billing plan that groups charge definitions with schedules. Requires OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "CreateChargePlanRequest",
        responseSchema: "ChargePlanResponse",
        statusCode: 201,
        tags: ["finance"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/finance/charge-assignments",
        summary: "Create charge assignment",
        description: "Assign a charge plan to a lease. Requires OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "CreateChargeAssignmentRequest",
        responseSchema: "ChargeAssignmentResponse",
        statusCode: 201,
        tags: ["finance"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/finance/charges/manual",
        summary: "Post manual charge",
        description: "Post a one-time manual charge to a lease. Requires MFA step-up and OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "PostManualChargeRequest",
        responseSchema: "LedgerEntryResponse",
        statusCode: 201,
        tags: ["finance"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/finance/adjustments",
        summary: "Apply adjustment",
        description: "Apply a credit or debit adjustment to a ledger entry. Requires MFA step-up and OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "ApplyAdjustmentRequest",
        responseSchema: "LedgerEntryResponse",
        statusCode: 200,
        tags: ["finance"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/payments/initiate",
        summary: "Initiate payment",
        description: "Initiate a payment via the configured payment gateway. Available to console users, residents, and service accounts.",
        requestBodySchema: "InitiatePaymentRequest",
        responseSchema: "PaymentResponse",
        statusCode: 201,
        tags: ["payments"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/payments/manual",
        summary: "Record manual payment",
        description: "Record a manual/offline payment. Requires MFA step-up and OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "RecordManualPaymentRequest",
        responseSchema: "PaymentResponse",
        statusCode: 201,
        tags: ["payments"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/settlement/refunds",
        summary: "Initiate refund",
        description: "Initiate a refund for a payment. Requires STRONG MFA and OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "InitiateRefundRequest",
        responseSchema: "RefundResponse",
        statusCode: 201,
        tags: ["settlement"],
        secured: true,
    },
    {
        method: "post",
        path: "/v1/settlement/exports",
        summary: "Create export job",
        description: "Create a settlement data export job. Requires STRONG MFA and OWNER, MANAGER, or ACCOUNTANT role.",
        requestBodySchema: "CreateExportJobRequest",
        responseSchema: "ExportJobResponse",
        statusCode: 201,
        tags: ["settlement"],
        secured: true,
    },
];

const ROUTES: RouteDoc[] = [...AUTH_ROUTES, ...BUSINESS_ROUTES];

function isZodSchema(value: unknown): value is ZodTypeAny {
    return Boolean(
        value &&
        typeof value === "object" &&
        "safeParse" in value &&
        typeof (value as { safeParse?: unknown }).safeParse === "function",
    );
}

function toOpenApiSchema(schema: ZodTypeAny, name: string) {
    const converted = zodToJsonSchema(schema, {
        name,
        target: "openApi3",
        $refStrategy: "none",
    });

    const definitions = (converted as { definitions?: Record<string, unknown> }).definitions;
    if (definitions && definitions[name]) {
        return definitions[name];
    }

    const raw = converted as Record<string, unknown>;
    const { $schema, definitions: _definitions, ...rest } = raw;
    return rest;
}

export function createOpenApiDocument(baseUrl: string) {
    const exportedEntries = Object.entries(Contracts);

    const schemas: Record<string, unknown> = {};
    for (const [name, value] of exportedEntries) {
        if (!isZodSchema(value)) {
            continue;
        }
        schemas[name] = toOpenApiSchema(value, name);
    }

    const paths: Record<string, Record<string, unknown>> = {};

    for (const route of ROUTES) {
        const statusCode = route.statusCode ?? 200;
        const tags = route.tags ?? (route.path.startsWith("/v1/auth") ? ["auth"] : ["v1"]);
        const isSecured = route.secured !== false && route.path.startsWith("/v1/");

        const responses: Record<string | number, unknown> = {
            [statusCode]: {
                description: "Successful response",
                content: route.responseSchema
                    ? {
                        "application/json": {
                            schema: {
                                $ref: `#/components/schemas/${route.responseSchema}`,
                            },
                        },
                    }
                    : {
                        "application/json": {
                            schema: { type: "object" },
                        },
                    },
            },
        };

        // Auth error responses for secured endpoints
        if (isSecured) {
            responses[401] = {
                description: "Authentication required or token invalid/expired",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AuthErrorResponse" },
                    },
                },
            };
            responses[403] = {
                description: "Forbidden — insufficient roles, scopes, audience, or MFA level",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AuthErrorResponse" },
                    },
                },
            };
            responses[429] = {
                description: "Rate limited",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AuthErrorResponse" },
                    },
                },
                headers: {
                    "Retry-After": {
                        description: "Seconds to wait before retrying",
                        schema: { type: "integer" },
                    },
                },
            };
        }

        if (route.requestBodySchema) {
            responses[400] = { description: "Invalid request body" };
        }

        if (!route.path.startsWith("/v1/auth")) {
            responses[501] = { description: "Not yet implemented" };
        }

        const operation: Record<string, unknown> = {
            summary: route.summary,
            description: route.description,
            operationId: `${route.method}_${route.path.replaceAll("/", "_").replace(/[^a-zA-Z0-9_]/g, "")}`,
            responses,
            tags,
        };

        // Security requirement
        if (isSecured) {
            operation.security = [
                { bearerAuth: [] },
                { apiKeyAuth: [] },
            ];
        }

        if (route.requestBodySchema) {
            operation.requestBody = {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref: `#/components/schemas/${route.requestBodySchema}`,
                        },
                    },
                },
            };
        }

        // Build parameters array
        const parameters: unknown[] = [];

        if (route.querySchema) {
            parameters.push({
                name: "query",
                in: "query",
                required: false,
                schema: {
                    $ref: `#/components/schemas/${route.querySchema}`,
                },
                description: "Query parameters represented by the request schema",
            });
        }

        if (route.parameters) {
            for (const param of route.parameters) {
                parameters.push(param);
            }
        }

        if (parameters.length > 0) {
            operation.parameters = parameters;
        }

        const pathItem = paths[route.path] ?? {};
        pathItem[route.method] = operation;
        paths[route.path] = pathItem;
    }

    paths["/health"] = {
        get: {
            summary: "Health check",
            operationId: "get_health",
            tags: ["system"],
            responses: {
                200: {
                    description: "Service is healthy",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    ok: { type: "boolean" },
                                    service: { type: "string" },
                                    timestamp: { type: "string", format: "date-time" },
                                },
                                required: ["ok", "service", "timestamp"],
                            },
                        },
                    },
                },
            },
        },
    };

    return {
        openapi: "3.1.0",
        info: {
            title: "RealtyOS API",
            version: "1.0.0",
            description:
                "Cloudflare Worker API for RealtyOS. " +
                "All protected endpoints require either a Bearer JWT or X-Api-Key header. " +
                "Schemas are sourced from @realtyos/contracts-api.",
            contact: {
                name: "RealtyOS Engineering",
                url: "https://docs.realtyos.com",
            },
        },
        servers: [{ url: baseUrl }],
        tags: [
            { name: "system", description: "Health checks and system endpoints" },
            { name: "auth", description: "Authentication — login, logout, token refresh, identity" },
            { name: "auth-mfa", description: "Multi-factor authentication enrollment, challenges, and verification" },
            { name: "auth-apikeys", description: "API key management for service accounts" },
            { name: "auth-password", description: "Password management — reset and change" },
            { name: "auth-sessions", description: "Session listing and revocation" },
            { name: "auth-audit", description: "Security audit event log" },
            { name: "properties", description: "Property management" },
            { name: "memberships", description: "Organization membership management" },
            { name: "leases", description: "Lease agreement management" },
            { name: "maintenance", description: "Maintenance request management" },
            { name: "finance", description: "Charge definitions, plans, assignments, manual charges, and adjustments" },
            { name: "payments", description: "Payment initiation and manual recording" },
            { name: "settlement", description: "Refunds and settlement data exports" },
        ],
        paths,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "JWT access token from the RealtyOS OIDC provider. " +
                        "Issued after login via /v1/auth/login or /v1/auth/callback. " +
                        "Contains user identity, session reference, roles, scopes, and MFA level.",
                },
                apiKeyAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "X-Api-Key",
                    description:
                        "API key for service account authentication. " +
                        "Format: `rto_<prefix>.<secret>`. " +
                        "Created via /v1/auth/api-keys. Scopes are limited to those assigned at creation.",
                },
            },
            schemas: {
                ...schemas,
                AuthErrorResponse: {
                    type: "object",
                    properties: {
                        error: {
                            type: "object",
                            properties: {
                                code: {
                                    type: "string",
                                    description: "Machine-readable error code",
                                    enum: [
                                        "AUTH_TOKEN_INVALID",
                                        "AUTH_TOKEN_EXPIRED",
                                        "AUTH_SESSION_REVOKED",
                                        "AUTH_SESSION_EXPIRED",
                                        "AUTH_CREDENTIALS_INVALID",
                                        "AUTH_AUDIENCE_MISMATCH",
                                        "AUTH_CLIENT_NOT_SELECTED",
                                        "AUTH_MFA_STEP_UP_REQUIRED",
                                        "AUTH_INSUFFICIENT_ROLE",
                                        "AUTH_INSUFFICIENT_SCOPE",
                                        "AUTH_FORBIDDEN",
                                        "AUTH_RATE_LIMITED",
                                        "AUTH_POLICY_DENIED",
                                        "AUTH_ACCOUNT_LOCKED",
                                        "AUTH_SYSTEM_ERROR",
                                    ],
                                },
                                message: {
                                    type: "string",
                                    description: "Human-readable error description",
                                },
                                correlationId: {
                                    type: "string",
                                    description: "Request correlation ID for support/debugging",
                                },
                                docsUrl: {
                                    type: "string",
                                    format: "uri",
                                    description: "Link to documentation for this error code",
                                },
                                obligations: {
                                    type: "array",
                                    description: "Actions the client can take to resolve the error",
                                    items: {
                                        type: "object",
                                        properties: {
                                            type: {
                                                type: "string",
                                                enum: [
                                                    "MFA_STEP_UP_REQUIRED",
                                                    "SELECT_CLIENT",
                                                    "MAKER_CHECKER_REQUIRED",
                                                    "REASON_REQUIRED",
                                                ],
                                            },
                                            level: { type: "string" },
                                            expiresInSeconds: { type: "integer" },
                                            allowedFactors: {
                                                type: "array",
                                                items: { type: "string" },
                                            },
                                        },
                                        required: ["type"],
                                    },
                                },
                                details: {
                                    type: "object",
                                    description: "Additional debug details (only in non-production environments)",
                                },
                            },
                            required: ["code", "message"],
                        },
                    },
                    required: ["error"],
                },
                WhoamiResponse: {
                    type: "object",
                    properties: {
                        actorType: { type: "string", enum: ["USER", "SERVICE_ACCOUNT"] },
                        userId: { type: "string" },
                        clientId: { type: "string", nullable: true },
                        membershipId: { type: "string", nullable: true },
                        roles: { type: "array", items: { type: "string" } },
                        audience: { type: "string", enum: ["console", "resident", "command", "service", "public"] },
                        authMethod: { type: "string" },
                        mfaLevel: { type: "string", enum: ["NONE", "STEP_UP", "STRONG"] },
                        sessionId: { type: "string" },
                    },
                    required: ["actorType", "userId", "roles", "audience", "authMethod", "mfaLevel", "sessionId"],
                },
            },
        },
    };
}

export function getDocumentedRoutes() {
    return ROUTES;
}
