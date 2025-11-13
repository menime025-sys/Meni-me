"use client";

import { memo } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export type RatingStarsProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeClassMap: Record<NonNullable<RatingStarsProps["size"]>, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const RatingStars = memo(({ rating, max = 5, size = "md", className, label }: RatingStarsProps) => {
  const normalizedMax = Math.max(max, 1);
  const clampedRating = Math.min(Math.max(rating, 0), normalizedMax);
  const iconSize = sizeClassMap[size] ?? sizeClassMap.md;

  return (
    <div
      className={cn("flex items-center gap-1 text-amber-400", className)}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {Array.from({ length: normalizedMax }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = clampedRating >= starValue;
        const hasPartialFill = !isFilled && clampedRating > index;

        return (
          <span key={starValue} className="relative inline-flex text-slate-300">
            <Star className={cn("transition", iconSize, isFilled ? "fill-amber-400 text-amber-400" : "text-slate-300")}
              aria-hidden="true"
            />
            {hasPartialFill ? (
              <Star
                className={cn(
                  "absolute left-0 top-0 text-amber-400 transition",
                  iconSize,
                  "fill-amber-400",
                )}
                style={{ clipPath: "inset(0 50% 0 0)" }}
                aria-hidden="true"
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
});

RatingStars.displayName = "RatingStars";

export default RatingStars;
