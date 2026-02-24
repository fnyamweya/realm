import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import {
  PostManualChargeRequest,
  RecordManualPaymentRequest,
  PublishPolicyRequest,
  ListLedgerEntriesRequest,
} from "@realtyos/contracts-api";
import type { Env } from "../env.js";

export async function getLedger(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams);
  const parsed = ListLedgerEntriesRequest.safeParse(query);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid query parameters",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: query ledger entries
  return Response.json({ data: { items: [], cursor: null } });
}

export async function getBalances(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: query balances
  return Response.json({ data: { items: [] } });
}

export async function postManualCharge(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  const parsed = PostManualChargeRequest.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid request body",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: delegate to finance domain
  const entryId = crypto.randomUUID();
  return Response.json({ data: { entryId } }, { status: 201 });
}

export async function recordManualPayment(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  const parsed = RecordManualPaymentRequest.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid request body",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: delegate to finance domain
  const paymentId = crypto.randomUUID();
  return Response.json({ data: { paymentId } }, { status: 201 });
}

export async function allocatePayment(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const paymentId = params["paymentId"];
  if (!paymentId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing paymentId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  const body: unknown = await req.json();
  // TODO: allocate payment
  return Response.json({ data: { paymentId, allocated: true } });
}

export async function getPolicies(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: list finance policies
  return Response.json({ data: { items: [] } });
}

export async function publishPolicy(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const kind = params["kind"];
  if (!kind) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing policy kind",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  const body: unknown = await req.json();
  const payload = typeof body === "object" && body !== null ? body : {};
  const parsed = PublishPolicyRequest.safeParse({ ...payload, kind, clientId: ctx.clientId });
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid request body",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: publish policy
  return Response.json({ data: { kind, published: true } });
}
