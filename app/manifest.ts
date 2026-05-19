import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Where Is My Bus | Live Delhi NCR Bus Tracker",
    short_name: "Bus Tracker",
    description: "Track government buses live across Delhi, Haryana, UP and Punjab.",
    start_url: "/",
    display: "standalone",
    background_color: "#1d4ed8",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable"
      },
    ],
  };
}
