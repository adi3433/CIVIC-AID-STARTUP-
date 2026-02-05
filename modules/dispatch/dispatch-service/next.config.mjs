/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Flask serving
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Set base path if needed (empty for root)
  basePath: '',
  
  // Trailing slash for static file compatibility
  trailingSlash: true,
};

export default nextConfig;
