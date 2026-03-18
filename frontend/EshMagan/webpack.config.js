// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
        },
        fullySpecified: false,
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
                            ['@babel/preset-env', { targets: { browsers: ['last 2 Chrome versions'] }, modules: 'commonjs' }],
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
    ],
    devServer: {
        port: 3000,
        hot: true,
    },
};
