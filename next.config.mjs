import constants from "next/constants.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "te-files-media.s3.eu-west-2.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

// Keep development chunks separate from production builds and `next start`.
// Running `next build` must not replace files used by an active dev server.
export default function config(phase) {
  return {
    ...nextConfig,
    distDir: phase === constants.PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
