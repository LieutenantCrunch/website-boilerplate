const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const siteConfig = require('./private/siteConfig.json');

module.exports = merge(common, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            __BASE_URL__: JSON.stringify(siteConfig['prod']['base-url'])
        })
    ]
});
