import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from "@/components/RatingStars";
import { IngredientDonut } from "@/components/IngredientDonut";
import { CompatibilityPanel } from "@/components/CompatibilityPanel";
import { OnlineBadge } from "@/components/OnlineBadge";
import productsData from "@/data/products.json";
import reviewsData from "@/data/reviews.json";
import { Product, DonutData, Ingredient, Review } from "@/types/product";
import { ingredientService } from "@/services/ingredientService";
import { evaluateCompatibility } from "@/utils/compatibility";
import { MAX_REQUESTS_PER_VIEW, CREDIT_LIMIT } from "@/config/constants";
import { ThumbsUp, Eye } from "lucide-react";
import { EU_DB_IFRAME } from "@/config/constants";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [donut, setDonut] = useState<DonutData>({
    LOW: 0,
    MODERATE: 0,
    HIGH: 0,
    UNKNOWN: 0
  });
  const [loading, setLoading] = useState(true);
  const [requestsMade, setRequestsMade] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      const found = productsData.find((p) => p.id === id) as Product | undefined;
      if (!found) {
        setLoading(false);
        return;
      }
      setProduct(found);

      // Fetch ingredients with budget limit
      const creditsBefore = ingredientService.getCreditsLeft();
      const ingList: Ingredient[] = [];
      let made = 0;

      for (const inci of found.ingredients || []) {
        if (made >= MAX_REQUESTS_PER_VIEW) {
          ingList.push({
            inci,
            risk: "UNKNOWN",
            source: "limited"
          });
          continue;
        }

        const data = await ingredientService.fetchINCI(inci);
        ingList.push(data);
        if (data.source === "cosmili") {
          made++;
        }
        if (ingredientService.getCreditsLeft() <= 0) break;
      }

      setIngredients(ingList);
      setRequestsMade(creditsBefore - ingredientService.getCreditsLeft());

      // Calculate donut
      const donutData: DonutData = { LOW: 0, MODERATE: 0, HIGH: 0, UNKNOWN: 0 };
      ingList.forEach((ing) => {
        const risk = (ing.risk || "UNKNOWN").toUpperCase() as keyof DonutData;
        donutData[risk] = (donutData[risk] || 0) + 1;
      });
      setDonut(donutData);

      setLoading(false);
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <Card className="p-6">
        <p>Loading product...</p>
      </Card>
    );
  }

  if (!product) {
    return (
      <Card className="p-6">
        <p>Product not found.</p>
      </Card>
    );
  }

  const compatibility = evaluateCompatibility(ingredients);
  const productReviews =
    reviewsData.find((r) => r.productId === product.id)?.reviews || [];

  return (
    <div className="space-y-6">
      {/* Product header */}
      <Card className="p-6">
        <div className="grid md:grid-cols-[340px_1fr] gap-6">
          <img
            src={product.image}
            alt={product.name}
            className="w-full rounded-lg border border-border"
          />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/products">
                <Badge variant="secondary">Products</Badge>
              </Link>
              {product.categories.map((cat) => (
                <Badge key={cat} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {product.brand} — {product.name}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <RatingStars rating={product.rating} size={20} />
              <span className="text-muted-foreground">
                ({product.reviewsCount})
              </span>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 flex-wrap">
              <Button>Shop now ▾</Button>
              <Badge variant="outline">
                Affiliate links — we earn from qualifying purchases.
              </Badge>
              <OnlineBadge
                status={ingredientService.getOnlineStatus()}
                creditMax={CREDIT_LIMIT}
                creditLeft={ingredientService.getCreditsLeft()}
                requestsMade={requestsMade}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Ingredients */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Ingredients</h3>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="eudb">EU DB</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <IngredientDonut donut={donut} />
            <CompatibilityPanel data={compatibility} />
            <div className="flex flex-wrap gap-2 mt-4">
              {product.attributes.map((attr) => (
                <Badge key={attr} variant="secondary">
                  {attr}
                </Badge>
              ))}
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">INCI (top ingredients)</h4>
              <div className="flex flex-wrap gap-2">
                {ingredients.slice(0, 6).map((ing) => (
                  <Badge
                    key={ing.inci}
                    variant="outline"
                    title={(ing.functions || []).join(", ")}
                  >
                    {ing.inci} · {ing.risk || "UNKNOWN"}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="eudb">
            <iframe
              src={EU_DB_IFRAME}
              width="100%"
              height="600"
              className="border-0 rounded-lg"
              title="EU Cosmetic Ingredient Database"
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Reviews */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Ratings & Reviews</h3>
        <div className="grid md:grid-cols-[260px_1fr] gap-6 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {product.rating.toFixed(1)}
            </div>
            <RatingStars rating={product.rating} size={20} />
            <Badge variant="secondary" className="mt-2">
              {product.reviewsCount} reviews
            </Badge>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const pct = Math.max(2, Math.round((stars / 5) * 20));
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-8 text-sm">{stars}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="my-6" />

        <h4 className="font-semibold mb-4">Reviews</h4>
        <div className="space-y-4">
          {productReviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <strong className="text-sm">{review.user.name}</strong>
                <Badge variant="outline" className="text-xs">
                  {review.user.skinType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {review.lang}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {review.date}
                </span>
              </div>
              <div className="mb-2">
                <RatingStars rating={review.rating} size={16} />
              </div>
              <p className="text-sm mb-3">{review.textFull}</p>
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {review.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Review photo ${i + 1}`}
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                  ))}
                </div>
              )}
              <Separator className="my-3" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> {review.upvotes}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {review.views}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
