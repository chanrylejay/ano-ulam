/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Image optimization was switched OFF here (`images: { unoptimized: true }`),
  // almost certainly a leftover from the Netlify era — netlify.toml is still in
  // the repo and that plugin needed the workaround. The site deploys to Vercel
  // now, where the optimizer is native.
  //
  // Leaving it off meant every dish photo shipped as the raw 800KB PNG to every
  // device, with no WebP/AVIF and no per-device resizing, which for an audience
  // on Philippine mobile data is the difference between a fast page and an
  // expensive one. It also meant the `sizes` hints on the hero image did
  // nothing. Verified by reading the served URL: the browser was fetching
  // /dishes/ginataang-kalabasa.png directly, not /_next/image, with an empty
  // srcset and Cache-Control: max-age=0.
  //
  // With it removed: automatic AVIF/WebP and the right size per device.
  //
  // Measured after enabling it, same image at 640px wide:
  //   raw PNG        803 KB
  //   optimized WebP  31 KB   (96% smaller)
  images: {
    // How long the SERVER may reuse an already-optimized variant before
    // regenerating it. Default 60s, which suits images that change; dish
    // photos never do.
    //
    // This governs the server's own reuse only. It does NOT change the
    // Cache-Control the browser receives: with this set to 30 days, optimized
    // responses still came back max-age=60.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        // Dish photos are immutable by convention: a changed photo gets a new
        // filename and a one-line edit in lib/dish-photos.ts, never an
        // in-place overwrite. That convention is what makes a long cache safe,
        // and it is the reason DISH_PHOTOS is an explicit map rather than a
        // path derived from the recipe id.
        //
        // WHAT THIS DOES AND DOES NOT DO, measured on a production build:
        // the raw file at /dishes/*.png now returns max-age=2592000. The
        // OPTIMIZED response at /_next/image still returns max-age=60, and no
        // config setting moved it — the optimizer reads /public off the disk,
        // so there is no upstream header for it to inherit. On Vercel the edge
        // CDN is what actually serves repeat requests for that endpoint, so
        // the practical cost is small, but do not read this rule as having
        // fixed the optimized TTL. It has not.
        source: '/dishes/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, immutable' },
        ],
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['canvas', 'pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('canvas', 'pdf-parse');
      }
    }
    return config;
  },
};

module.exports = nextConfig;
