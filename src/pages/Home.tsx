import { SearchDropdown } from "@/components/SearchDropdown";
import { CategoryIconNav } from "@/components/CategoryIconNav";
import { TrendingDiscussions } from "@/components/TrendingDiscussions";
import { Flower2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            discover <ArrowRight className="inline w-10 h-10 text-pink-500" /> the{" "}
            <span className="italic font-bold">best</span>{" "}
            <Flower2 className="inline w-10 h-10 text-blue-400" />
          </h1>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            <Flower2 className="inline w-10 h-10 text-green-400" /> of k-beauty with{" "}
            <span className="text-pink-500 font-bold">picky</span>
            <sub className="text-sm">©</sub>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-6">
            Find skincare holy grails from honest product reviews, discussion boards, ingredient
            analyses, product testing events, and more!
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-left">What are you looking for today?</h2>
          <SearchDropdown className="w-full" />
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-8">
        <CategoryIconNav />
      </section>

      {/* Curated Collections */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flower2 className="w-6 h-6 text-primary" />
            Curated K-beauty collections
          </h2>
          <Button variant="ghost" size="sm">VIEW ALL</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-gradient-to-br from-accent to-muted flex items-center justify-center text-muted-foreground"
            >
              Collection {i}
            </div>
          ))}
        </div>
      </section>

      {/* Trending Discussions */}
      <TrendingDiscussions />
    </div>
  );
}
