import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import path from "path";

// --- Extend Express Request to store userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const app = express();

app.use(express.json());
app.use(cookieParser());

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const isProd = process.env.NODE_ENV === "production";

function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

function auth(req: Request, res: Response, next: NextFunction) {
  // cookie-parser adds req.cookies at runtime, TS may not always know it
  const token = (req as any).cookies?.token as string | undefined;

  if (!token) return res.status(401).json({ error: "No auth" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid auth" });
  }
}

/** AUTH */
const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras/números/_"),
  password: z.string().min(6),
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, username, password } = parsed.data;

  const [emailUsed, userUsed] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);

  if (emailUsed) return res.status(409).json({ error: "Email ya existe" });
  if (userUsed) return res.status(409).json({ error: "Username ya existe" });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, username, password: hash } });

  const token = signToken(user.id);
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd, // required for sameSite=none
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  return res.json({ id: user.id, email: user.email, username: user.username });
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = signToken(user.id);
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  return res.json({ id: user.id, username: user.username });
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ ok: true });
});

app.get("/api/me", auth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (!user) return res.status(401).json({ error: "No auth" });
  return res.json(user);
});

/** WRAPS */
const wrapCreateSchema = z.object({
  title: z.string().min(1),
  kind: z.string().min(1),
  year: z.coerce.number().int(),
});

app.get("/api/wraps", auth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const wraps = await prisma.wrap.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { date: "asc" } } },
  });
  return res.json(wraps);
});

app.post("/api/wraps", auth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const parsed = wrapCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const wrap = await prisma.wrap.create({ data: { ...parsed.data, userId } });
  return res.json(wrap);
});

const itemSchema = z.object({
  name: z.string().min(1),
  date: z.string(), // ISO
  notes: z.string().optional(),
});

app.post("/api/wraps/:id/items", auth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const wrapId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const wrap = await prisma.wrap.findFirst({ where: { id: wrapId, userId } });
  if (!wrap) return res.status(404).json({ error: "Wrap no existe" });

  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await prisma.wrapItem.create({
    data: {
      wrapId,
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      notes: parsed.data.notes,
    },
  });

  return res.json(item);
});

app.delete("/api/wraps/:id", auth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const wrapId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const wrap = await prisma.wrap.findFirst({ where: { id: wrapId, userId } });
  if (!wrap) return res.status(404).json({ error: "Wrap no existe" });

  await prisma.wrapItem.deleteMany({ where: { wrapId } });
  await prisma.wrap.delete({ where: { id: wrapId } });

  return res.json({ ok: true });
});

/** PROD: servir React build */
if (isProd) {
  const webDist = path.join(__dirname, "../../web/dist");
  app.use(express.static(webDist));
  // Express 5 no longer accepts "*" string routes; use a regex catch-all.
  app.get(/.*/, (_req: Request, res: Response) => res.sendFile(path.join(webDist, "index.html")));
}

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API on :${port}`));
