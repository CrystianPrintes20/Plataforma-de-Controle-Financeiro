import type { ErrorRequestHandler } from "express";
import { getErrorStatus } from "../errors";
import { fail } from "..";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  const status = getErrorStatus(err);
  const message = err?.message || "Internal Server Error";

  console.error("Internal Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json(fail(message, err?.details));
};
