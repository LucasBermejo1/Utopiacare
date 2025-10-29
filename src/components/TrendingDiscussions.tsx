import { useState } from "react";
import { Link } from "react-router-dom";
import { Flower2 } from "lucide-react";
import { DiscussionCard } from "./DiscussionCard";
import { Button } from "./ui/button";
import discussionsData from "@/data/discussions.json";
import { Discussion } from "@/types/discussion";

const categories = ["All", "Skin Concern", "Routine Help", "Makeup Help", "Hair & Body Care Help", "Product Info"];

export function TrendingDiscussions() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredDiscussions = selectedCategory === "All"
    ? discussionsData
    : discussionsData.filter((d: Discussion) => d.category === selectedCategory);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flower2 className="w-6 h-6 text-primary" />
          Trending Discussions
        </h2>
        <Link to="/products">
          <Button variant="ghost" size="sm">VIEW ALL</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDiscussions.map((discussion: Discussion) => (
          <DiscussionCard key={discussion.id} discussion={discussion} />
        ))}
      </div>
    </section>
  );
}
