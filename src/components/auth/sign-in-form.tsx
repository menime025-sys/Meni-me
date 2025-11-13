"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

const signInSchema = z.object({
	email: z
 		.string()
 		.min(1, "Email is required.")
 		.email("Please enter a valid email address."),
	password: z
 		.string()
 		.min(1, "Password is required.")
 		.min(8, "Password must be at least 8 characters."),
});

type SignInSchema = z.infer<typeof signInSchema>;

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
		const candidate = error as Partial<AuthClientError> & {
			message?: string;
		};

		return {
			code: typeof candidate.code === "string" ? candidate.code : "unknown_error",
			status:
				typeof candidate.status === "number" ? candidate.status : 400,
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

export interface SignInFormProps {
	redirectTo?: string | null;
	onSuccess?: (options: { callbackURL?: string; data: unknown }) => void;
	onError?: (error: AuthClientError) => void;
	defaultValues?: Partial<SignInSchema>;
}

export function SignInForm({
	redirectTo,
	onSuccess,
	onError,
	defaultValues,
}: SignInFormProps) {
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

	const form = useForm<SignInSchema>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
			...defaultValues,
		},
	});

	const handleSubmit = (values: SignInSchema) => {
		setFormError(null);

		startTransition(async () => {
			const payload = {
				email: values.email,
				password: values.password,
				...(computedRedirect ? { callbackURL: computedRedirect } : {}),
			} as const;

			const { error, data } = await signIn.email(payload);

			if (error) {
				const normalizedError = normalizeAuthClientError(
					error,
					"Unable to sign in.",
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

	const handleGoogleSignIn = () => {
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
										autoComplete="current-password"
										placeholder="Enter your password"
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
					{isPending ? "Signing in…" : "Sign in"}
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
						onClick={handleGoogleSignIn}
						disabled={isSubmitDisabled}
						aria-busy={isGooglePending}
					>
						{isGooglePending ? "Redirecting…" : "Continue with Google"}
					</Button>
				</div>
			</form>
		</FormProvider>
	);
}
