'use strict';

const path = require('path');
const { name } = require('./package.json');

const pluginName = name
    .replace('@terascope/ui-', '')
    .replace('-', '_')
    .trim();

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    target: 'web',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                include: path.join(__dirname, 'src'),
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        library: `UIPlugin_${pluginName}`,
        libraryTarget: 'window',
        filename: 'plugin.js',
        auxiliaryComment: `UI Plugin for ${name}`,
        path: path.resolve(__dirname, 'build'),
    },
    externals: {
        '@terascope/ui-components': 'UIComponents',
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-router-dom': 'ReactRouterDOM',
    },
};
