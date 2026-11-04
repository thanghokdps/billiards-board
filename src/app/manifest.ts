import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ăn Bill",
    short_name: "Ăn Bill",
    description: "Thắng ăn điểm, thua ăn bill",
    start_url: "/vi",
    display: "standalone",
    background_color: "#0b1410",
    theme_color: "#0b1410",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
