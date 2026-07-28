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
        // VERIFIED ON THE DEPLOYED SITE, not just locally. Both the raw file
        // and the optimized /_next/image response come back with
        // `Cache-Control: public, max-age=2592000, immutable`, and the
        // optimized one as image/webp.
        //
        // Worth knowing because it cost a wrong conclusion once: `next start`
        // on a dev machine reports max-age=60 for the optimized response no
        // matter what this rule says. That is a local artifact. Check headers
        // against the real deployment before believing them.
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
