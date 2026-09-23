import { useState } from "react";

import { getLocalFallbackImage } from "@/features/maps";
import { cn } from "@/lib/utils";

interface MapImageProps {
  src: string;
  slug: string;
  alt: string;
  className?: string;
}

/** Map splash image that swaps to the local fallback asset if the remote image fails to load. */
export function MapImage({ src, slug, alt, className }: MapImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedFallback, setTriedFallback] = useState(false);

  function handleError(): void {
    if (triedFallback) return;
    const fallback = getLocalFallbackImage(slug);
    setTriedFallback(true);
    if (fallback !== undefined) {
      setCurrentSrc(fallback);
    }
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={cn("h-full w-full object-cover", className)}
      loading="lazy"
    />
  );
}
