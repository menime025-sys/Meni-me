import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { HANGERHIGHLIGHTS } from "@/config/hanger-highlight-constants";
import Image from "next/image";
import React from "react";

const NewArrivals = () => {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-10">
      <div className="flex flex-col gap-20">
        {/* New arrival */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2
              className="text-3xl font-extrabold uppercase"
              style={{ wordSpacing: "0.5rem" }}
            >
              new arrivals
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
                className="pl-3 sm:basis-1/2 lg:basis-1/4 border-none"
              >
                <Card className="h-full overflow-hidden rounded-none py-0 border-none">
                  <CardContent className="relative h-[40vh] w-full overflow-hidden p-0">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                      className="object-cover"
                      priority={item.id === 1}
                    />
                  </CardContent>
                  <CardDescription>
                    <div className="px-4 pb-4 pt-3 text-lg font-semibold text-slate-900">
                      {item.title}
                    </div>
                  </CardDescription>
                </Card>
              </CarouselItem>
            ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Curated style */}
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2
              className="text-3xl font-extrabold uppercase"
              style={{ wordSpacing: "0.5rem" }}
            >
              curated styles
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
      </div>
    </section>
  );
};

export default NewArrivals;
