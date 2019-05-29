'use strict';

const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
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
        filename: 'plugin.[hash].js',
        auxiliaryComment: `UI Plugin for ${name}`,
        path: path.resolve(__dirname, 'build'),
    },
    externals: {
        '@terascope/ui-components': 'UIComponents',
        react: 'React',
        'react-dom': 'ReactDOM',
        'react-router-dom': 'ReactRouterDOM',
        'react-apollo': 'ReactApollo',
        'apollo-boost': 'ApolloBoost',
        'apollo-client': 'ApolloClient',
    },
    plugins: [
        new CleanWebpackPlugin({
            verbose: true,
        }),
    ],
};
