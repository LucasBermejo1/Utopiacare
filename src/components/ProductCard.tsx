import { Product } from "@/types/product";
import { Card } from "./ui/card";
import { RatingStars } from "./RatingStars";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/products/${product.id}`}>
      <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-44 object-cover rounded-lg border border-border"
        />
        <div className="mt-2">
          <div className="font-semibold text-sm">{product.brand}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {product.name}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <RatingStars rating={product.rating} size={14} />
            <span className="text-muted-foreground">
              ({product.reviewsCount})
            </span>
            <span className="flex items-center gap-1 text-muted-foreground ml-auto">
              <Heart className="w-3 h-3 fill-current" />
              {product.picks}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
