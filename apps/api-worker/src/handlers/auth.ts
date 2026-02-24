import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import type { Env } from "../env.js";

// ── Auth: Session ──

export async function getSession(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: look up session from cookie
  return Response.json({ data: { authenticated: false } });
}

export async function selectClient(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: validate & switch active clientId on session
  return Response.json({ data: { ok: true } });
}

export async function logout(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: destroy session
  return Response.json({ data: { ok: true } });
}

// ── Resident Auth ──

export async function residentLogin(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: delegate to identity-access residentLogin use-case
  return Response.json({ data: { mfaRequired: false } });
}

export async function passwordResetRequest(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: delegate to password-reset flow
  return Response.json({ data: { ok: true } });
}

export async function passwordResetVerify(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: verify reset token
  return Response.json({ data: { ok: true } });
}

export async function passwordResetComplete(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: complete password reset
  return Response.json({ data: { ok: true } });
}

// ── MFA ──

export async function mfaEnrollTotp(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: generate TOTP secret & QR URI
  return Response.json({ data: { totpUri: "otpauth://totp/..." } });
}

export async function mfaChallenge(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: issue MFA challenge
  return Response.json({ data: { challengeId: crypto.randomUUID() } });
}

export async function mfaVerify(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: verify MFA code
  return Response.json({ data: { ok: true } });
}

// ── API Keys ──

export async function createServiceAccount(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: create service account
  return Response.json({ data: { serviceAccountId: crypto.randomUUID() } }, { status: 201 });
}

export async function createApiKey(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: create API key
  return Response.json({ data: { apiKeyId: crypto.randomUUID() } }, { status: 201 });
}

export async function listApiKeys(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: list API keys
  return Response.json({ data: { items: [], cursor: null } });
}

export async function revokeApiKey(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const _id = params["id"];
  // TODO: revoke API key
  return Response.json({ data: { ok: true } });
}

// ── OIDC ──

export async function oidcLogin(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const _audience = params["audience"];
  // TODO: redirect to OIDC provider
  return Response.json({ data: { redirectUrl: "https://idp.example.com/authorize" } });
}

export async function oidcCallback(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const _audience = params["audience"];
  // TODO: handle OIDC callback, exchange code, create session
  return Response.json({ data: { ok: true } });
}
