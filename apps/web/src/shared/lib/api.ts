import { z } from "zod";

export type ApiError = {
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  data: T;
};

async function parseJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiGet<T>(url: string, schema: z.ZodSchema<T>) {
  const res = await fetch(url, { credentials: "include" });
  const body = (await parseJsonSafely(res)) as ApiSuccess<T> | ApiError | null;

  if (!res.ok) {
    const message = body && "message" in body ? body.message : res.statusText;
    throw new Error(message || "Request failed");
  }

  if (!body || !("data" in body)) {
    throw new Error("Invalid response format");
  }

  return schema.parse(body.data);
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  schema: z.ZodSchema<T> | null,
  payload?: unknown
) {
  const res = await fetch(url, {
    method,
    headers: payload ? { "Content-Type": "application/json" } : {},
    body: payload ? JSON.stringify(payload) : undefined,
    credentials: "include",
  });

  if (res.status === 204) return null;

  const body = (await parseJsonSafely(res)) as ApiSuccess<T> | ApiError | null;

  if (!res.ok) {
    const message = body && "message" in body ? body.message : res.statusText;
    throw new Error(message || "Request failed");
  }

  if (!schema) return body as ApiSuccess<T> | null;

  if (!body || !("data" in body)) {
    throw new Error("Invalid response format");
  }

  return schema.parse(body.data);
}
