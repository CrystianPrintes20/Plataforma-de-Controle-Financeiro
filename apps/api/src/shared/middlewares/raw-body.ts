import express from "express";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function rawBodyParser() {
  return express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  });
}
