const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        popup: './src/popup.ts',
        background: './src/background.ts',
        content: './src/content.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ],
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    optimization: {
        minimize: false,
        splitChunks: {
            chunks: (chunk) => chunk.name !== 'background',
            name: false,
        },
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'public' }
            ],
        }),
    ],
    experiments: {
        topLevelAwait: true
    },
    target: ['web', 'es2020']
} 