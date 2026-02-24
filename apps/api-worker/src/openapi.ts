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
}

const ROUTES: RouteDoc[] = [
  {
    method: "post",
    path: "/v1/properties",
    summary: "Create property",
    requestBodySchema: "CreatePropertyRequest",
    responseSchema: "PropertyResponse",
    statusCode: 201,
  },
  {
    method: "get",
    path: "/v1/properties",
    summary: "List properties",
    querySchema: "ListPropertiesRequest",
    responseSchema: "ListPropertiesResponse",
    statusCode: 200,
  },
  {
    method: "post",
    path: "/v1/memberships",
    summary: "Create membership",
    requestBodySchema: "CreateMembershipRequest",
    responseSchema: "MembershipResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/leases",
    summary: "Create lease",
    requestBodySchema: "CreateLeaseRequest",
    responseSchema: "LeaseResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/maintenance/requests",
    summary: "Create maintenance request",
    requestBodySchema: "CreateMaintenanceRequestSchema",
    responseSchema: "MaintenanceRequestResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/finance/charge-definitions",
    summary: "Create charge definition",
    requestBodySchema: "CreateChargeDefinitionRequest",
    responseSchema: "ChargeDefinitionResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/finance/charge-plans",
    summary: "Create charge plan",
    requestBodySchema: "CreateChargePlanRequest",
    responseSchema: "ChargePlanResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/finance/charge-assignments",
    summary: "Create charge assignment",
    requestBodySchema: "CreateChargeAssignmentRequest",
    responseSchema: "ChargeAssignmentResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/finance/charges/manual",
    summary: "Post manual charge",
    requestBodySchema: "PostManualChargeRequest",
    responseSchema: "LedgerEntryResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/finance/adjustments",
    summary: "Apply adjustment",
    requestBodySchema: "ApplyAdjustmentRequest",
    responseSchema: "LedgerEntryResponse",
    statusCode: 200,
  },
  {
    method: "post",
    path: "/v1/payments/initiate",
    summary: "Initiate payment",
    requestBodySchema: "InitiatePaymentRequest",
    responseSchema: "PaymentResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/payments/manual",
    summary: "Record manual payment",
    requestBodySchema: "RecordManualPaymentRequest",
    responseSchema: "PaymentResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/settlement/refunds",
    summary: "Initiate refund",
    requestBodySchema: "InitiateRefundRequest",
    responseSchema: "RefundResponse",
    statusCode: 201,
  },
  {
    method: "post",
    path: "/v1/settlement/exports",
    summary: "Create export job",
    requestBodySchema: "CreateExportJobRequest",
    responseSchema: "ExportJobResponse",
    statusCode: 201,
  },
];

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
    const operation: Record<string, unknown> = {
      summary: route.summary,
      description: route.description,
      operationId: `${route.method}_${route.path.replaceAll("/", "_").replace(/[^a-zA-Z0-9_]/g, "")}`,
      responses: {
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
        400: {
          description: "Invalid request",
        },
        501: {
          description: "Not yet implemented",
        },
      },
      tags: ["v1"],
    };

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

    if (route.querySchema) {
      operation.parameters = [
        {
          name: "query",
          in: "query",
          required: false,
          schema: {
            $ref: `#/components/schemas/${route.querySchema}`,
          },
          description: "Query parameters represented by the request schema",
        },
      ];
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
        "Cloudflare Worker API for RealtyOS. Schemas are sourced from @realtyos/contracts-api.",
    },
    servers: [{ url: baseUrl }],
    paths,
    components: {
      schemas,
    },
  };
}

export function getDocumentedRoutes() {
  return ROUTES;
}
