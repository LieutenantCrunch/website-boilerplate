const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            __BASE_URL__: JSON.stringify('https://10.0.0.10/')
        })
    ]
});
