import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "publickey-credentials-get=*, publickey-credentials-create=*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
