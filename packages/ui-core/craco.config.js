'use strict';

module.exports = {
    eslint: {
        configure: (eslintConfig) => {
            if (!eslintConfig.overrides) eslintConfig.overrides = [];
            eslintConfig.overrides.push({
                files: ['**/*.ts', '**/*.tsx'],
                parserOptions: {
                    warnOnUnsupportedTypeScriptVersion: false
                }
            });
            return eslintConfig;
        }
    },
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.resolve.mainFields = ['module', 'main'];
            webpackConfig.mode = 'development';
            webpackConfig.optimization.minimize = false;
            return webpackConfig;
        }
    },
    plugins: []
};
