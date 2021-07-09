const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const siteConfig = require('./private/siteConfig.json');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            __BASE_URL__: JSON.stringify(siteConfig['dev']['base-url'])
        })
    ]
});
