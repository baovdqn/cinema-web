"use client";

import { useState } from "react";
import { getPosterUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FALLBACK = "/poster-placeholder.svg";

export function Poster({
  posterKey,
  alt,
  className,
}: {
  posterKey: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const src = getPosterUrl(posterKey);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failedSrc === src ? FALLBACK : src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={cn("bg-neutral-800 object-cover", className)}
    />
  );
}
