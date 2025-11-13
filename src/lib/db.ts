import { PrismaClient } from "@/generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

const sanitizeDatabaseUrl = (rawUrl?: string | null) => {
    if (!rawUrl) {
        return rawUrl ?? undefined;
    }

    try {
        const parsed = new URL(rawUrl);

        if (parsed.searchParams.has("channel_binding")) {
            parsed.searchParams.delete("channel_binding");
            return parsed.toString();
        }

        return rawUrl;
    } catch (error) {
        console.warn("[prisma] Failed to parse DATABASE_URL for sanitization", error);
        return rawUrl;
    }
};

const resolvedDatabaseUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);

if (resolvedDatabaseUrl && resolvedDatabaseUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const createBaseClient = () =>
    new PrismaClient(
        resolvedDatabaseUrl
            ? {
                  datasources: {
                      db: {
                          url: resolvedDatabaseUrl,
                      },
                  },
              }
            : undefined,
    );

const createPrismaClient = (): PrismaClient => {
    const client = createBaseClient();

    if (process.env.PRISMA_ACCELERATE_URL) {
        return client.$extends(withAccelerate()) as unknown as PrismaClient;
    }

    return client;
};

type PrismaClientSingleton = PrismaClient;

declare global {
    var prisma: PrismaClientSingleton | undefined;
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}
