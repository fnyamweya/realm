/**
 * Structured auth error responses.
 *
 * Maps auth error codes to HTTP responses with a consistent envelope:
 * ```json
 * {
 *   "error": {
 *     "code": "AUTH_TOKEN_EXPIRED",
 *     "message": "Token has expired",
 *     "details": {},
 *     "obligations": [],
 *     "correlationId": "cor_xxx"
 *   }
 * }
 * ```
 *
 * Obligations are included when the client can take action to resolve
 * the error (e.g., MFA step-up, client selection).
 */

// ─── Error Code → HTTP Status Mapping ────────────────────────────────────────

const ERROR_STATUS_MAP: Record<string, number> = {
    AUTH_AUDIENCE_MISMATCH: 403,
    AUTH_TOKEN_EXPIRED: 401,
    AUTH_TOKEN_INVALID: 401,
    AUTH_SESSION_REVOKED: 401,
    AUTH_SESSION_EXPIRED: 401,
    AUTH_CLIENT_NOT_SELECTED: 403,
    AUTH_MFA_STEP_UP_REQUIRED: 403,
    AUTH_MAKER_CHECKER_REQUIRED: 403,
    AUTH_REASON_REQUIRED: 403,
    AUTH_RATE_LIMITED: 429,
    AUTH_ACCOUNT_LOCKED: 423,
    AUTH_CREDENTIALS_INVALID: 401,
    AUTH_FORBIDDEN: 403,
    AUTH_INSUFFICIENT_SCOPE: 403,
    AUTH_INSUFFICIENT_ROLE: 403,
    AUTH_POLICY_DENIED: 403,
};

// ─── Error Code → Human-Readable Defaults ────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
    AUTH_AUDIENCE_MISMATCH: "Your session does not have access to this endpoint",
    AUTH_TOKEN_EXPIRED: "Authentication token has expired. Please re-authenticate.",
    AUTH_TOKEN_INVALID: "Authentication token is invalid",
    AUTH_SESSION_REVOKED: "Your session has been revoked",
    AUTH_SESSION_EXPIRED: "Your session has expired. Please log in again.",
    AUTH_CLIENT_NOT_SELECTED: "No client selected. Please select a client first.",
    AUTH_MFA_STEP_UP_REQUIRED: "Multi-factor authentication is required for this action",
    AUTH_MAKER_CHECKER_REQUIRED: "This action requires approval from another authorized user",
    AUTH_REASON_REQUIRED: "A reason must be provided for this action",
    AUTH_RATE_LIMITED: "Too many requests. Please try again later.",
    AUTH_ACCOUNT_LOCKED: "Account is temporarily locked due to too many failed attempts",
    AUTH_CREDENTIALS_INVALID: "Invalid credentials",
    AUTH_FORBIDDEN: "You do not have permission to perform this action",
    AUTH_INSUFFICIENT_SCOPE: "Insufficient API key scopes for this operation",
    AUTH_INSUFFICIENT_ROLE: "Your role does not have access to this resource",
    AUTH_POLICY_DENIED: "Access denied by security policy",
};

// ─── Obligation Types ────────────────────────────────────────────────────────

export interface AuthObligation {
    type: "MFA_STEP_UP_REQUIRED" | "SELECT_CLIENT" | "MAKER_CHECKER_REQUIRED" | "REASON_REQUIRED";
    /** MFA level required, if applicable */
    level?: string;
    /** Time window for completing the obligation */
    expiresInSeconds?: number;
    /** Allowed MFA factors */
    allowedFactors?: string[];
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

// ─── Error Response Envelope ─────────────────────────────────────────────────

export interface AuthErrorEnvelopeError {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
    obligations?: AuthObligation[] | undefined;
    correlationId?: string | undefined;
    /** Link to documentation for this error */
    docsUrl?: string | undefined;
}

export interface AuthErrorEnvelope {
    error: AuthErrorEnvelopeError;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create an auth error JSON response.
 */
export function authErrorResponse(
    errorCode: string,
    options?: {
        message?: string | undefined;
        details?: Record<string, unknown> | undefined;
        obligations?: AuthObligation[] | undefined;
        correlationId?: string | undefined;
        headers?: Record<string, string> | undefined;
        debug?: boolean;
    },
): Response {
    const status = ERROR_STATUS_MAP[errorCode] ?? 403;
    const message = options?.message ?? ERROR_MESSAGES[errorCode] ?? "Authentication error";

    const envelope: AuthErrorEnvelope = {
        error: {
            code: errorCode,
            message,
            docsUrl: `https://docs.realtyos.com/api/errors#${errorCode.toLowerCase()}`,
        },
    };

    if (options?.correlationId) {
        envelope.error.correlationId = options.correlationId;
    }

    if (options?.obligations && options.obligations.length > 0) {
        envelope.error.obligations = options.obligations;
    }

    // Only include details in debug mode
    if (options?.debug && options?.details) {
        envelope.error.details = options.details;
    }

    const responseHeaders = new Headers({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
    });

    // Add WWW-Authenticate header for 401 responses
    if (status === 401) {
        responseHeaders.set(
            "www-authenticate",
            `Bearer realm="realtyos-api", error="${errorCode}", error_description="${message}"`,
        );
    }

    // Add custom headers (e.g., rate limit headers)
    if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
            responseHeaders.set(key, value);
        }
    }

    return new Response(JSON.stringify(envelope, null, 2), {
        status,
        headers: responseHeaders,
    });
}

/**
 * Create a rate-limited error response with appropriate headers.
 */
export function rateLimitedResponse(
    retryAfter: number,
    correlationId?: string,
): Response {
    return authErrorResponse("AUTH_RATE_LIMITED", {
        ...(correlationId ? { correlationId } : {}),
        headers: {
            "Retry-After": retryAfter.toString(),
        },
    });
}

/**
 * Create an MFA step-up required response with obligation details.
 */
export function mfaRequiredResponse(
    options?: {
        level?: string;
        expiresInSeconds?: number;
        allowedFactors?: string[];
        correlationId?: string;
    },
): Response {
    return authErrorResponse("AUTH_MFA_STEP_UP_REQUIRED", {
        ...(options?.correlationId ? { correlationId: options.correlationId } : {}),
        obligations: [{
            type: "MFA_STEP_UP_REQUIRED",
            level: options?.level ?? "STRONG",
            expiresInSeconds: options?.expiresInSeconds ?? 300,
            allowedFactors: options?.allowedFactors ?? ["TOTP", "WEBAUTHN", "SMS_OTP"],
        }],
    });
}

/**
 * Create a client-selection required response.
 */
export function clientSelectionRequiredResponse(
    correlationId?: string,
): Response {
    return authErrorResponse("AUTH_CLIENT_NOT_SELECTED", {
        ...(correlationId ? { correlationId } : {}),
        obligations: [{
            type: "SELECT_CLIENT",
        }],
    });
}

/**
 * Create a policy-denied response.
 */
export function policyDeniedResponse(
    reason: string,
    obligations?: AuthObligation[],
    correlationId?: string,
): Response {
    return authErrorResponse("AUTH_POLICY_DENIED", {
        message: reason,
        ...(correlationId ? { correlationId } : {}),
        ...(obligations ? { obligations } : {}),
    });
}

/**
 * Create a generic 500 error response (auth system failure).
 */
export function authSystemErrorResponse(
    correlationId?: string,
    debug?: boolean,
    details?: Record<string, unknown>,
): Response {
    const envelope: AuthErrorEnvelope = {
        error: {
            code: "AUTH_SYSTEM_ERROR",
            message: "An internal authentication error occurred. Please try again.",
            ...(correlationId ? { correlationId } : {}),
        },
    };

    if (debug && details) {
        envelope.error.details = details;
    }

    return new Response(JSON.stringify(envelope, null, 2), {
        status: 500,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
        },
    });
}
