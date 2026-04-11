// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);

module.exports = {
    target: 'web',
    entry: path.resolve(appDirectory, 'index.web.js'),
    output: {
        filename: 'bundle.web.js',
        path: path.resolve(appDirectory, 'web-build'),
    },
    resolve: {
        extensions: ['.web.js', '.js', '.web.jsx', '.jsx', '.ts', '.tsx'],
        mainFields: ['browser', 'module', 'main'],
        alias: {
            'react-native$': 'react-native-web',
            '@react-navigation/native': path.resolve(appDirectory, 'src/stubs/navigation.js'),
            '@react-navigation/native-stack': path.resolve(appDirectory, 'src/stubs/navigation.js'),
            '@react-navigation/bottom-tabs': path.resolve(appDirectory, 'src/stubs/navigation.js'),
            '@apollo/client': path.resolve(appDirectory, 'src/stubs/apollo.js'),
            './NativeNavigator': path.resolve(appDirectory, 'src/stubs/navigation.js'),
            'react-native-image-picker': path.resolve(appDirectory, 'src/stubs/image-picker.js'),
            '@react-native-community/geolocation': path.resolve(appDirectory, 'src/stubs/geolocation.js'),
            '@react-native-async-storage/async-storage': path.resolve(appDirectory, 'src/stubs/async-storage.js'),
            'react-native-maps': path.resolve(appDirectory, 'src/stubs/maps.js'),
        },
        fullySpecified: false,
        fallback: {
            fs: false,
            path: false,
            os: false,
            crypto: false,
            process: require.resolve('process/browser'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|mjs|cjs|ts|tsx)$/,
                exclude: /node_modules\/(?!(react-native-image-picker|@react-native-community\/geolocation)\/).*/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: { browsers: ['last 2 Chrome versions'] }, modules: false }],
                            '@babel/preset-react',
                            '@babel/preset-typescript',
                        ],
                        plugins: ['react-native-web'],
                    },
                },
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                use: { loader: 'url-loader', options: { limit: 8192 } },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(appDirectory, 'public/index.html'),
        }),
        new webpack.DefinePlugin({
            __DEV__: JSON.stringify(true),
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    devServer: {
        port: 3000,
        hot: true,
    },
};
