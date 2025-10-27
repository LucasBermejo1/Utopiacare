interface RatingStarsProps {
  rating: number;
  size?: number;
}

export function RatingStars({ rating, size = 18 }: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const partialFill = rating - fullStars;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const fill = i < fullStars ? 1 : i === fullStars ? partialFill : 0;
        const gradientId = `star-gradient-${i}-${rating}`;

        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="inline-block"
          >
            <defs>
              <linearGradient id={gradientId}>
                <stop offset={`${fill * 100}%`} stopColor="#f7b500" />
                <stop offset={`${fill * 100}%`} stopColor="hsl(var(--border))" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${gradientId})`}
              d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192z"
            />
          </svg>
        );
      })}
    </div>
  );
}
