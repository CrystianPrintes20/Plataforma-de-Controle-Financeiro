export type ApiErrorBody = {
  message: string;
  details?: unknown;
};

export type ApiSuccessBody<T> = {
  data: T;
};

export function ok<T>(data: T): ApiSuccessBody<T> {
  return { data };
}

export function fail(message: string, details?: unknown): ApiErrorBody {
  return { message, details };
}
