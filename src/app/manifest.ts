import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The LEE Experience",
    short_name: "LEEE",
    description:
      "Social enterprise ecosystem empowering communities in Lebanon and MENA",
    start_url: "/",
    display: "standalone",
    background_color: "#E8F1FB",
    theme_color: "#5895D0",
    icons: [
      {
        src: "/LEEE-LOGO.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/LEEE-LOGO.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
