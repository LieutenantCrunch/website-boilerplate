/* https://webpack.js.org/guides/production/ */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.jsx',
        admin: './src/admin.jsx'
    },
    module: {
        rules: [
            {
                test: /\.js(x)?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-env"]
                }
            },
            {
                test: /\.css$/i,
                /*exclude: /node_modules/,*/
                include: [
                    path.resolve(__dirname, 'src/styles/styles.css'),
                    path.resolve(__dirname, 'node_modules/react-image-lightbox/style.css')
                ],
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            url: false
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx'] /* This allows you to import from files without specifying the extension like ./src/components/MyClass */
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    output: {
        path: path.resolve(__dirname, '../server/dist/js'),
        publicPath: '/public/js/',
        filename: '[name].[contenthash].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: '../index.html',
            chunks: ['index'],
            template: './public/index.html'
        }),
        new HtmlWebpackPlugin({
            filename: '../admin.html',
            chunks: ['admin'],
            template: './public/admin.html'
        })
    ]
}
