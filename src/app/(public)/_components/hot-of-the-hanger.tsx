"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { HANGERHIGHLIGHTS } from "@/config/hanger-highlight-constants";
import { SHOPIMAGE } from "@/config/shop-image-constants";
import { HANGERHIGHLIGHTSVIDEO } from "@/config/shop-the-look-video";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const videoCache = new Map<string, string>();

const HotOfTheHanger = () => {
  const [cachedVideos, setCachedVideos] = useState<Record<string, string>>(
    () => Object.fromEntries(videoCache.entries()),
  );
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    if (videoCache.size === HANGERHIGHLIGHTSVIDEO.length) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const preloadVideos = async () => {
      await Promise.all(
        HANGERHIGHLIGHTSVIDEO.map(async ({ video }) => {
          if (videoCache.has(video)) {
            return;
          }

          try {
            const response = await fetch(video, {
              signal: controller.signal,
              mode: "cors",
            });

            if (!response.ok) {
              console.warn(`Failed to preload video: ${video}`);
              return;
            }

            const blob = await response.blob();
            const objectURL = URL.createObjectURL(blob);
            videoCache.set(video, objectURL);
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              return;
            }

            console.warn("Video preload error", error);
          }
        }),
      );

      if (isMounted) {
        setCachedVideos(Object.fromEntries(videoCache.entries()));
      }
    };

    void preloadVideos();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    HANGERHIGHLIGHTSVIDEO.forEach(({ video }) => {
      const element = videoRefs.current[video];

      if (!element) {
        return;
      }

      const resolvedSrc = cachedVideos[video] ?? video;

      if (element.src !== resolvedSrc) {
        element.src = resolvedSrc;
      }

      if (!element.muted) {
        element.muted = true;
      }

      const playPromise = element.play();

      if (playPromise) {
        playPromise.catch(() => {
          element.addEventListener(
            "canplay",
            () => {
              element.play().catch(() => {});
            },
            { once: true },
          );
        });
      }
    });
  }, [cachedVideos]);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-10">
      <div className="flex flex-col gap-20">
        {/* Hot's of the hanger*/}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2
              className="text-3xl font-extrabold uppercase"
              style={{ wordSpacing: "0.5rem" }}
            >
              Hot off the hanger
            </h2>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-3">
            {HANGERHIGHLIGHTS.map((item) => (
              <CarouselItem
                key={item.id}
                className="pl-3 sm:basis-1/2 lg:basis-1/4"
              >
                <Card className="h-full overflow-hidden rounded-none border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md py-0">
                  <CardContent className="relative h-[40vh] w-full overflow-hidden p-0">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                      className="object-cover"
                      priority={item.id === 1}
                    />
                    <span className="absolute bottom-4 px-6 inline-flex text-5xl font-extrabold uppercase tracking-[0.3em] text-slate-200">
                      {item.badge}
                    </span>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Shop the look */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2
              className="text-3xl font-extrabold uppercase"
              style={{ wordSpacing: "0.5rem" }}
            >
              shop the look
            </h2>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-3">
            {HANGERHIGHLIGHTSVIDEO.map((item) => (
              <CarouselItem
                key={item.id}
                className="pl-3 sm:basis-1/2 lg:basis-1/4"
              >
                <Card className="h-full overflow-hidden rounded-none border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md py-0">
                  <CardContent className="relative h-[40vh] w-full overflow-hidden p-0">
                    <video
                      ref={(node) => {
                        if (node) {
                          videoRefs.current[item.video] = node;
                        }
                      }}
                      src={cachedVideos[item.video] ?? item.video}
                      aria-label={item.alt}
                      className="h-full w-full object-cover"
                      muted
                      autoPlay
                      loop
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      controlsList="nodownload noremoteplayback"
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Shop the look grid */}
        <div className="flex flex-col gap-8 rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm md:p-8">
          <div className="mb-2 text-center">
            <h2
              className="text-3xl font-extrabold uppercase"
              style={{ wordSpacing: "0.5rem" }}
            >
              shop the look
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:gap-10">
            {SHOPIMAGE.map((item) => (
              <div
                key={item.id}
                className="relative aspect-3/3 w-full overflow-hidden rounded-2xl"
              >
                <Image
                  src={item.images}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                  className="object-cover"
                  priority={item.id === 1}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HotOfTheHanger;
