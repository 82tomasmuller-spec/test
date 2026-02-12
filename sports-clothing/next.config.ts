import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "jsonwebtoken", "nodemailer", "qrcode"],
};

export default nextConfig;
