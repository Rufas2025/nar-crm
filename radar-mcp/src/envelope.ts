/**
 * Envelope de resposta do domínio Radar.
 *
 * O protocolo MCP oficial é preservado: toda resposta continua sendo
 * `{ content: [...], structuredContent: {...} }`. O envelope abaixo é o objeto
 * de DOMÍNIO transportado dentro de `structuredContent` — não é um protocolo
 * próprio concorrente ao MCP.
 */

import { randomUUID } from 'node:crypto';
import { toSafeError, type ErrorCode } from './errors.js';

export interface EnvelopeMeta {
  request_id: string;
  capabilities_used: string[];
  [key: string]: unknown;
}

export interface SuccessEnvelope<T = unknown> {
  ok: true;
  data: T;
  warnings: string[];
  meta: EnvelopeMeta;
}

export interface ErrorEnvelope {
  ok: false;
  error: { code: ErrorCode; message: string; retryable: boolean; hint?: string };
  meta: { request_id: string };
}

export type Envelope<T = unknown> = SuccessEnvelope<T> | ErrorEnvelope;

/**
 * Resposta MCP conforme o SDK, carregando o envelope de domínio.
 * O index signature é exigido pelo tipo `CallToolResult` do SDK.
 */
export interface McpToolResponse {
  [x: string]: unknown;
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
  isError?: true;
}

function wrap(envelope: Envelope, isError: boolean): McpToolResponse {
  const res: McpToolResponse = {
    content: [{ type: 'text', text: JSON.stringify(envelope, null, 2) }],
    structuredContent: envelope as unknown as Record<string, unknown>,
  };
  if (isError) res.isError = true;
  return res;
}

export function newRequestId(): string {
  return randomUUID();
}

export function success<T>(
  data: T,
  opts: { requestId: string; warnings?: string[]; capabilitiesUsed?: string[]; meta?: Record<string, unknown> },
): McpToolResponse {
  const envelope: SuccessEnvelope<T> = {
    ok: true,
    data,
    warnings: opts.warnings ?? [],
    meta: {
      request_id: opts.requestId,
      capabilities_used: opts.capabilitiesUsed ?? [],
      ...(opts.meta ?? {}),
    },
  };
  return wrap(envelope, false);
}

export function failure(
  code: ErrorCode,
  message: string,
  opts: { requestId: string; hint?: string; retryable?: boolean },
): McpToolResponse {
  const envelope: ErrorEnvelope = {
    ok: false,
    error: {
      code,
      message,
      retryable: opts.retryable ?? false,
      ...(opts.hint ? { hint: opts.hint } : {}),
    },
    meta: { request_id: opts.requestId },
  };
  return wrap(envelope, true);
}

/** Converte qualquer exceção num envelope de erro seguro. */
export function failureFromError(err: unknown, requestId: string): McpToolResponse {
  const safe = toSafeError(err);
  return failure(safe.code, safe.message, {
    requestId,
    hint: safe.hint,
    retryable: safe.retryable,
  });
}
