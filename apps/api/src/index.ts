import "./config/env";
import { startServer } from "./http/server";

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
