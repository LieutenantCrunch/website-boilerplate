const path = require('path');

module.exports = {
    entry: './src/index.jsx',
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
            }
        ]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx'] /* This allows you to import from files without specifying the extension like ./src/components/MyClass */
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    }
}