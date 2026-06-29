"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BottleShot from "@/components/ui/BottleShot";
import { cn } from "@/lib/utils";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = images.length;

  useEffect(() => {
    if (n <= 1 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), 1500);
    return () => clearInterval(t);
  }, [n, paused]);

  const go = (i: number) => setIndex(((i % n) + n) % n);

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-3xl bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <BottleShot
            src={images[index]}
            alt={alt}
            className="absolute inset-0"
            priority={index === 0}
            sizes="(max-width:1024px) 100vw, 560px"
          />
        </motion.div>
      </AnimatePresence>

      {n > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Image précédente"
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-paper/80 text-ink shadow-soft backdrop-blur transition hover:bg-paper"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Image suivante"
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-paper/80 text-ink shadow-soft backdrop-blur transition hover:bg-paper"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Image ${i + 1}`}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/30")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
