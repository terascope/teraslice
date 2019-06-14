'use strict';

const path = require('path');

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
        mainFields: ['browser', 'main', 'module'],
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'plugin.js',
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
    plugins: [],
};
