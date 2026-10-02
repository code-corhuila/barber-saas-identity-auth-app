const { withNativeFederation } = require('@softarc/native-federation/build');

// identity-auth-app is an Ionic React domain app mounted by the Angular shell (ADR-013).
// It exposes only './mount' and shares nothing: it brings its own React, and it receives the
// shell's HTTP client and session through the mount context, so it never needs the shell's code.
module.exports = withNativeFederation({
  name: 'identity-auth',
  exposes: {
    './mount': './src/mount.tsx',
  },
  shared: {},
  skip: ['vitest', 'http-server', 'esbuild', 'typescript'],
});
