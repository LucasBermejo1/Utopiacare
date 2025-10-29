export interface Discussion {
  id: string;
  author: {
    name: string;
    avatar: string;
    skinType: string;
  };
  title: string;
  excerpt: string;
  timeAgo: string;
  views: number;
  upvotes: number;
  comments: number;
  category: string;
}
