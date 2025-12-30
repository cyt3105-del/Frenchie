const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add blockList to exclude problematic cache files
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver?.blockList || []),
    /react-native-css-interop\/\.cache/,
    /\.cache/,
    /node_modules\/.*\.cache/
  ]
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
