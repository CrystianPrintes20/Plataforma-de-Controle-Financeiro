import { createServer } from "http";
import { createApp } from "./app";
import { registerRoutes } from "../routes";
import { errorHandler } from "../shared/middlewares/error-handler";
import { serveStatic } from "../static";
import { env } from "../config/env";
import { log } from "../shared";

export async function startServer() {
  const app = createApp();
  const httpServer = createServer(app);

  await registerRoutes(httpServer, app);

  app.use(errorHandler);

  if (env.nodeEnv === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("../vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen(
    {
      port: env.port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${env.port}`);
    }
  );
}
