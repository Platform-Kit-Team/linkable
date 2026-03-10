import type { PlatformKitConfig } from "./src/lib/config";

const config: PlatformKitConfig = {
  contentCollections: {
    blog: {
      directory: "content/blog",
      format: "markdown",
      label: "Blog",
      icon: "BookOpen",
      sortField: "date",
      sortOrder: "desc",
      defaultEnabled: false,
      searchable: true,
      fieldDefaults: {
        published: true,
        tags: [],
        excerpt: "",
        coverImage: "",
        audio: "",
        publishDate: "",
        expirationDate: "",
        rss: true,
      },
      indexFilter: (item: Record<string, unknown>) => {
        if (item.published === false) return false;
        const today = new Date().toISOString().slice(0, 10);
        if (
          item.publishDate &&
          typeof item.publishDate === "string" &&
          today < item.publishDate
        )
          return false;
        if (
          item.expirationDate &&
          typeof item.expirationDate === "string" &&
          today > item.expirationDate
        )
          return false;
        return true;
      },
      generateRss: true,
      generateOgPages: { routePrefix: "content" },
    },
  },
};

export default config;
