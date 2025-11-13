import Link from "next/link";
import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Access your Hub Fashiion account",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface SignInPageProps {
  searchParams?: SearchParams;
}

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = (searchParams ? await searchParams : undefined) ?? {};
  const redirectTo =
    typeof params.redirect === "string" && params.redirect.length > 0
      ? params.redirect
      : "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and password to sign in.
          </p>
        </div>

        <SignInForm redirectTo={redirectTo} />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={{ pathname: "/sign-up", query: { redirect: redirectTo } }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
