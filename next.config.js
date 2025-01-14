/** @type {import('next').NextConfig} */

const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'http://127.0.0.1:8000/api/v1/:path*',
        },
      ];
    } else {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
      ];
    }
  },
  transpilePackages: [
    '@solana/wallet-adapter-react-ui',
    // other packages
  ],
};

module.exports = nextConfig; 