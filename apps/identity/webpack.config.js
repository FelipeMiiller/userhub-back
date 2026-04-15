const { composePlugins, withNx } = require('@nx/webpack');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../');

/** Scopes that belong to this monorepo and must be bundled (not externalized). */
const WORKSPACE_SCOPES = ['@hub/', '@packages/'];

module.exports = composePlugins(withNx(), (config) => {
  // Map workspace aliases to source directories so webpack bundles from source
  // and bypasses package.json "exports" restrictions in node_modules symlinks.
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    '@hub/shared-lib': path.join(ROOT, 'shared/lib'),
    '@hub/shared-module': path.join(ROOT, 'shared/module'),
    '@packages/identity': path.join(ROOT, 'packages/identity'),
    '@packages/notification': path.join(ROOT, 'packages/notification'),
  };

  config.externals = [
    function ({ request }, callback) {
      // Bundle all workspace-local packages so they are compiled from source.
      if (WORKSPACE_SCOPES.some((scope) => request.startsWith(scope))) {
        return callback();
      }
      // Externalize all other npm packages (non-relative, non-absolute).
      if (!request.startsWith('.') && !request.startsWith('/')) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ];
  return config;
});
