import { ArrowBigUp, MessageCircle, Eye } from "lucide-react";
import { Discussion } from "@/types/discussion";
import { Card } from "./ui/card";

interface DiscussionCardProps {
  discussion: Discussion;
}

export function DiscussionCard({ discussion }: DiscussionCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={discussion.author.avatar}
          alt={discussion.author.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{discussion.author.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
              {discussion.author.skinType}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{discussion.timeAgo}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {discussion.views} Views
            </span>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-base mb-2">{discussion.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{discussion.excerpt}</p>

      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowBigUp className="w-4 h-4" />
          <span>{discussion.upvotes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{discussion.comments}</span>
        </button>
      </div>
    </Card>
  );
}
