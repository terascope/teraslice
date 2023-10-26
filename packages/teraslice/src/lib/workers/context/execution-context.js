'use strict';

const { makeExecutionContext } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const spawnAssetLoader = require('../assets/spawn');

module.exports = async function _makeExecutionContext(context, executionConfig) {
    const assetIds = await spawnAssetLoader(executionConfig.assets, context);

    return makeExecutionContext({
        context,
        executionConfig,
        terasliceOpPath,
        assetIds,
    });
};
