import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import productsData from "@/data/products.json";

export default function Home() {
  const highlights = productsData.slice(0, 4);

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h1 className="text-3xl font-bold text-primary mb-2">Utopiacare</h1>
        <p className="text-lg text-muted-foreground mb-4">
          Discover skincare that truly fits your skin.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Products, brands, discussions"
            className="max-w-md"
          />
          <Button asChild>
            <Link to="/products">Explore products</Link>
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
