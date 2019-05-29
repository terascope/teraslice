'use strict';

const path = require('path');
const CracoLess = require('craco-less');
const { getLoader, loaderByName, throwUnexpectedConfigError } = require('@craco/craco');

module.exports = {
    webpack: {
        alias: {
            '../../theme.config$': path.join(__dirname, '/src/semantic-ui/theme.config'),
        },
        configure: (webpackConfig) => {
            webpackConfig.resolve.mainFields = ['module', 'main'];
            return webpackConfig;
        },
    },
    plugins: [
        {
            plugin: CracoLess,
            options: {
                noIeCompat: true,
            },
        },
        {
            plugin: {
                overrideWebpackConfig: (ctx) => {
                    const { context, webpackConfig } = ctx;
                    const { isFound, match: fileLoaderMatch } = getLoader(
                        webpackConfig,
                        loaderByName('file-loader')
                    );

                    if (!isFound) {
                        throwUnexpectedConfigError({
                            message: `Can't find file-loader in the ${context.env} webpack config!`,
                        });
                    }

                    fileLoaderMatch.loader.exclude.push(/theme.config$/);
                    fileLoaderMatch.loader.exclude.push(/\.variables$/);
                    fileLoaderMatch.loader.exclude.push(/\.overrides$/);

                    return webpackConfig;
                },
            },
        },
    ],
};
