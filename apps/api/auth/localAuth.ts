import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

function getSessionStore() {
  const pgStore = connectPg(session);
  return new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
}

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  console.warn("SESSION_SECRET not set. Using a dev-only secret.");
  return "dev-session-secret";
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: getSessionSecret(),
      store: getSessionStore(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: sessionTtl,
      },
    })
  );
}

async function ensureLocalUser() {
  const userId = process.env.DEV_USER_ID ?? "local-dev-user";
  const email = process.env.AUTH_EMAIL ?? "local@dev";

  return authStorage.upsertUser({
    id: userId,
    email,
    firstName: "Local",
    lastName: "Dev",
  });
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};

    const expectedEmail = process.env.AUTH_EMAIL ?? "local@dev";
    const expectedPassword = process.env.AUTH_PASSWORD ?? "dev-password";

    if (email !== expectedEmail || password !== expectedPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = await ensureLocalUser();
    req.session.userId = user.id;
    res.json(user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Failed to logout" });
      res.clearCookie("connect.sid");
      res.status(204).send();
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await authStorage.getUser(req.session.userId);
    res.json(user);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await authStorage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  (req as any).user = { claims: { sub: user.id } };
  return next();
};
