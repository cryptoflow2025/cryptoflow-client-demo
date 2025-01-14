const config = {
  development: {
    baseURL: 'http://127.0.0.1:8000/api/v1',
  },
  production: {
    baseURL: '/api/v1', // use vercel rewrite
    // baseURL: 'http://139.177.202.65:8000/api/v1', // Update with your production URL
  }
};

// Use development config for localhost, production for actual domain
const isProduction = process.env.NODE_ENV === 'production';
export const apiConfig = isProduction ? config.production : config.development; 