/** @type {import('next').NextConfig} */
const nextConfig = {
    // Override webpack config to exclude node-specific modules from client bundle
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
        }
        return config;
    },
};

export default nextConfig;
