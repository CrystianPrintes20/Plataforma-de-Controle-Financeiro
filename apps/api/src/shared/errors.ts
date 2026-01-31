import { HTTP_STATUS } from "./http-status";

export function getErrorStatus(err: any): number {
  if (err?.status) return err.status;
  if (err?.statusCode) return err.statusCode;
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}
