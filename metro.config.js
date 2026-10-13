const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver problemas con TurboModules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Permitir empaquetar módulos WebAssembly (requerido por expo-sqlite en web)
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// @noble/hashes importa internamente "@noble/hashes/crypto", que no figura en su "exports":
// Metro lo resuelve igual por ruta de archivo pero emite un WARN. Se resuelve explícitamente
// (variante no-Node, correcta para React Native y web) para evitar el aviso.
const path = require('path');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@noble/hashes/crypto') {
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'node_modules', '@noble', 'hashes', 'crypto.js'),
    };
  }
  return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;