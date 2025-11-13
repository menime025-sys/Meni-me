import Link from "next/link";
import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Sign up for Hub Fashiion",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface SignUpPageProps {
  searchParams?: SearchParams;
}

export default async function SignUpPage({
  searchParams,
}: SignUpPageProps) {
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
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm">
            Join Hub Fashiion to access personalized experiences.
          </p>
        </div>

        <SignUpForm redirectTo={redirectTo} />

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href={{ pathname: "/sign-in", query: { redirect: redirectTo } }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
