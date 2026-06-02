import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Lazy singleton — only instantiated when first accessed at runtime,
// NOT at module load / build time. This prevents Netlify build failures
// when DATABASE_URL is absent during static analysis.

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Netlify → Site Settings → Environment Variables."
    );
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Proxy that defers instantiation until a property is first accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (process.env.NODE_ENV === "production") {
      // In production create a fresh client each cold start
      if (!global._prisma) {
        global._prisma = createPrismaClient();
      }
      return (global._prisma as any)[prop];
    } else {
      // In development reuse across hot-reloads
      if (!global._prisma) {
        global._prisma = createPrismaClient();
      }
      return (global._prisma as any)[prop];
    }
  },
});

