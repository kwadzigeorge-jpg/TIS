const path = require('path');

// Resolve presets/plugins from root node_modules (yarn workspaces hoisting)
const rootModules = path.resolve(__dirname, '../node_modules');
const appModules = path.resolve(__dirname, 'node_modules');

function resolve(pkg) {
  try {
    return require.resolve(pkg, { paths: [appModules, rootModules] });
  } catch {
    return pkg;
  }
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [resolve('babel-preset-expo')],
    plugins: [resolve('react-native-reanimated/plugin')],
  };
};
