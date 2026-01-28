import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://pickup.el-garage.net"; // ← 本番URLが決まったら差し替え

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/pickup`,
      lastModified: new Date(),
    },
  ];
}
