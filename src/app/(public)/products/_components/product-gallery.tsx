"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { StorefrontImage } from "@/lib/storefront/catalog";
import { cn } from "@/lib/utils";

const FALLBACK_GRADIENT = "bg-linear-to-br from-slate-200 via-slate-100 to-slate-300";

export type ProductGalleryProps = {
  title: string;
  images: StorefrontImage[];
};

const ProductGallery = ({ title, images }: ProductGalleryProps) => {
  const normalizedImages = useMemo(() => images.filter((image) => Boolean(image?.url)), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = normalizedImages[activeIndex] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {activeImage ? (
          <Image
            src={activeImage.url}
            alt={`${title} preview ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 85vw, 40vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className={cn("flex h-full w-full items-center justify-center", FALLBACK_GRADIENT)}>
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Meni-me</span>
          </div>
        )}
      </div>

      {normalizedImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-4">
          {normalizedImages.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${image.fileId ?? image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Preview image ${index + 1}`}
                aria-pressed={isActive}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-2xl border transition",
                  isActive ? "border-slate-900" : "border-transparent hover:border-slate-300",
                )}
              >
                <Image
                  src={image.url}
                  alt={`${title} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default ProductGallery;
