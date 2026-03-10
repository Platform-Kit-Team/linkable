/**
 * Blog-specific types for the Bento theme.
 *
 * These types describe the shape of blog post data as consumed by the
 * theme's components. They are NOT platform-level — other themes may
 * define their own blog shapes or skip blog support entirely.
 */

export type BlogPostMeta = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  published: boolean;
  tags: string[];
  publishDate: string;
  expirationDate: string;
  audio?: string;
  rss?: boolean;
};

export type BlogPost = BlogPostMeta & {
  content: string;
  html: string;
  audioUrl?: string;
};
