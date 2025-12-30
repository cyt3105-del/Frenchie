const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add blockList to exclude problematic cache files
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver?.blockList || []),
    /react-native-css-interop/,
    /\.cache/,
    /node_modules\/.*\.cache/,
    /.*\.cache\/.*/,
    /react-native-css-interop\/\.cache\/web\.css/
  ]
};

// Only apply NativeWind in development, skip in production build
if (process.env.NODE_ENV !== 'production') {
  module.exports = withNativeWind(config, {
    input: "./global.css",
    forceWriteFileSystem: true,
  });
} else {
  module.exports = config;
}
