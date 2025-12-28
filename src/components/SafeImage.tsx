import { useState } from "react";

type SafeImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

export function SafeImage({ src, alt, className = "", fallbackSrc = "/placeholder.svg" }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => setCurrentSrc(fallbackSrc)}
      className={className}
    />
  );
}


