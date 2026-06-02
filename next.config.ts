import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấu hình xuất bản trang tĩnh (Static HTML Export) cho GitHub Pages
  output: "export",
  
  // Tắt tối ưu hóa ảnh Next.js mặc định vì GitHub Pages không có Node.js server chạy ngầm để xử lý ảnh động
  images: {
    unoptimized: true,
  },

  // LƯU Ý: Nếu bạn deploy lên GitHub Pages dạng `tài-khoản.github.io/tromate` (chạy trên subfolder):
  // Bạn hãy mở 2 dòng dưới ra và sửa '/tromate' thành tên repository của bạn trên GitHub:
  // basePath: '/tromate',
  // assetPrefix: '/tromate',
};

export default nextConfig;
