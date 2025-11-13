"use client";

import { useTransition, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  variant?: ComponentProps<typeof Button>["variant"];
  children?: ReactNode;
}

export function SignOutButton({
  variant = "outline",
  children,
}: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Signing out…" : children ?? "Sign out"}
    </Button>
  );
}
