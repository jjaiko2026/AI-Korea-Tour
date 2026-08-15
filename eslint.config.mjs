import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: [".next/**", "drizzle/**", "node_modules/**"],
  },
];

export default config;
