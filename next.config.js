/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "loremflickr.com" },
      // Facebook Page images (posts, profile photos) come from the Meta CDN.
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      // Instagram media CDN (for IG cross-posted content thumbnails).
      { protocol: "https", hostname: "**.cdninstagram.com" },
    ],
  },
};

module.exports = nextConfig;
