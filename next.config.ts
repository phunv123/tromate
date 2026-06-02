import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấu hình xuất bản trang tĩnh (Static HTML Export) cho GitHub Pages
  output: "export",
  
  // Tắt tối ưu hóa ảnh Next.js mặc định vì GitHub Pages không có Node.js server chạy ngầm để xử lý ảnh động
  images: {
    unoptimized: true,
  },

  // Cấu hình đường dẫn subfolder cho GitHub Pages
  basePath: "/tromate",
  assetPrefix: "/tromate",
};

export default nextConfig;
