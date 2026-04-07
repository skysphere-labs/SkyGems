import { ErrorResponseSchema, type ErrorCode } from "@skygems/shared";

type SchemaParser<T> = {
  parse(input: unknown): T;
};

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function parseJsonBody<T>(request: Request, schema: SchemaParser<T>): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    throw new HttpError(400, "invalid_request", "Request body must be valid JSON.", {
      cause: String(error),
    });
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    throw new HttpError(400, "invalid_request", "Request body failed schema validation.", {
      cause: String(error),
    });
  }
}

export function jsonResponse<T>(data: T, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
): Response {
  return jsonResponse(
    ErrorResponseSchema.parse({
      error: {
        code,
        message,
        details,
      },
    }),
    status,
  );
}

export function handleApiError(error: unknown): Response {
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.code, error.message, error.details);
  }

  return errorResponse(500, "provider_failure", "Unexpected API worker failure.", {
    cause: String(error),
  });
}
