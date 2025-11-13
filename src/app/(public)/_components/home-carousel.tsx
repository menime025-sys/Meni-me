import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "@/components/ui/carousel";
import { SLIDES } from "@/config/slides-constants";
import Image from "next/image";


const HomeCarousel = () => {
  return (
    <div className="w-full">
      <Carousel
        className="w-full h-[75vh]"
        opts={{
          align: "center",
          loop: true,
        }}
      >
        <CarouselContent className="h-full" viewportClassName="h-full">
          {SLIDES.map((slide, index) => (
            <CarouselItem key={slide.id} className="h-full">
              <Card className="h-full w-full overflow-hidden border-none p-0 shadow-none rounded-none">
                <CardContent className="relative h-full w-full p-0 rounded-none">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 768px) 95vw, 95vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className="absolute -bottom-12 left-1/2 -translate-x-1/2" />
      </Carousel>
    </div>
  );
};

export default HomeCarousel;
