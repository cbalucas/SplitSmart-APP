const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver problemas con TurboModules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Permitir empaquetar módulos WebAssembly (requerido por expo-sqlite en web)
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;