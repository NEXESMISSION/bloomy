import Image from "next/image";
import { cn } from "@/lib/utils";

/** Photo produit sur fond gris uniforme (le fond de la photo = bg-surface, donc sans couture). */
export default function BottleShot({
  src,
  alt,
  className,
  priority = false,
  sizes = "320px",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </div>
  );
}
