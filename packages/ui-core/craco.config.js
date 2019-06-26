'use strict';

module.exports = {
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
