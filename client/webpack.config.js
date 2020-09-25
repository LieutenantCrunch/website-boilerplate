const path = require('path');

module.exports = {
    entry: {
        index: './src/index.jsx',
        admin: './src/admin.jsx'
    },
    mode: 'development',
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
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader']
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
        filename: '[name].js'
    },
    devtool: 'source-map'
}