import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

// Database is at project root (./dev.db), not in prisma folder
const dbPath = path.resolve(process.cwd(), "dev.db").replace(/\\/g, "/");
console.log("[PRISMA] Resolved database path:", dbPath);

// Create the Prisma adapter with URL-based configuration (Prisma 7 style)
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PrismaClient with the adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
