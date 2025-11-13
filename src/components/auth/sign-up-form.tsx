"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type SignUpSchema = z.infer<typeof signUpSchema>;

type AuthClientError = {
  code?: string;
  message: string;
  status: number;
  statusText: string;
};

const normalizeAuthClientError = (
  error: unknown,
  fallbackMessage: string,
): AuthClientError => {
  if (error instanceof Error) {
    return {
      code: "unknown_error",
      status: 400,
      statusText: "Bad Request",
      message: error.message || fallbackMessage,
    };
  }

  if (error && typeof error === "object") {
    const candidate = error as Partial<AuthClientError> & { message?: string };

    return {
      code: typeof candidate.code === "string" ? candidate.code : "unknown_error",
      status: typeof candidate.status === "number" ? candidate.status : 400,
      statusText:
        typeof candidate.statusText === "string"
          ? candidate.statusText
          : "Bad Request",
      message:
        typeof candidate.message === "string" && candidate.message.length > 0
          ? candidate.message
          : fallbackMessage,
    };
  }

  return {
    code: "unknown_error",
    status: 400,
    statusText: "Bad Request",
    message: fallbackMessage,
  };
};

export interface SignUpFormProps {
  /** Optional callback URL to redirect after a successful sign up. */
  redirectTo?: string | null;
  /** Invoked after a successful sign up. */
  onSuccess?: (options: { callbackURL?: string; data: unknown }) => void;
  /** Invoked when sign up fails. */
  onError?: (error: AuthClientError) => void;
  /** Provide default form field values. */
  defaultValues?: Partial<SignUpSchema>;
}

export function SignUpForm({
  redirectTo,
  onSuccess,
  onError,
  defaultValues,
}: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isPending, startTransition] = useTransition();

  const computedRedirect =
    redirectTo ??
    searchParams?.get("redirectTo") ??
    searchParams?.get("redirect") ??
    undefined;

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (values: SignUpSchema) => {
    setFormError(null);

    startTransition(async () => {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        ...(computedRedirect ? { callbackURL: computedRedirect } : {}),
      } as const;

      const { error, data } = await signUp.email(payload);

      if (error) {
        const normalizedError = normalizeAuthClientError(
          error,
          "Unable to sign up.",
        );

        setFormError(normalizedError.message);
        onError?.(normalizedError);
        return;
      }

      onSuccess?.({ callbackURL: computedRedirect, data });

      if (computedRedirect) {
        router.push(computedRedirect);
      } else {
        router.refresh();
      }
    });
  };

  const handleGoogleSignUp = () => {
    setFormError(null);
    setIsGooglePending(true);

    void signIn
      .social({
        provider: "google",
        ...(computedRedirect ? { callbackURL: computedRedirect } : {}),
      })
  .catch((error: unknown) => {
        const normalizedError = normalizeAuthClientError(
          error,
          "Unable to continue with Google.",
        );

        setFormError(normalizedError.message);
        onError?.(normalizedError);
      })
      .finally(() => {
        setIsGooglePending(false);
      });
  };

  const isSubmitDisabled = isPending || isGooglePending;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="grid gap-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="Jane Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitDisabled} aria-busy={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>

        <div className="grid gap-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={isSubmitDisabled}
            aria-busy={isGooglePending}
          >
            {isGooglePending ? "Redirecting…" : "Sign up with Google"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
