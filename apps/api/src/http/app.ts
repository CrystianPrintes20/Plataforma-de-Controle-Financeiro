import express from "express";
import { requestLogger } from "../shared";
import { rawBodyParser } from "../shared/middlewares/raw-body";

export function createApp() {
  const app = express();

  app.use(rawBodyParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(requestLogger);

  return app;
}
