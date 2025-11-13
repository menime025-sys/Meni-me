import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export const getUserFromRequest = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || !("user" in session) || !session.user) {
    return null;
  }

  return session.user;
};

export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getUserFromRequest>>>;

export const getCurrentUser = async () => {
  const headerList = await headers();
  const sessionHeaders = new Headers(Array.from(headerList.entries()));
  const session = await auth.api.getSession({ headers: sessionHeaders });

  if (!session || !("user" in session) || !session.user) {
    return null;
  }

  return session.user;
};
