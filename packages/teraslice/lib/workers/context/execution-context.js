'use strict';

const { SlicerExecutionContext, WorkerExecutionContext } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const spawnAssetLoader = require('../assets/spawn');

module.exports = async function makeExecutionContext(context, executionConfig) {
    const assetIds = await spawnAssetLoader(executionConfig.assets);

    if (context.assignment === 'execution_controller') {
        return new SlicerExecutionContext({
            context,
            executionConfig,
            terasliceOpPath,
            assetIds,
        });
    }

    if (context.assignment === 'worker') {
        return new WorkerExecutionContext({
            context,
            executionConfig,
            terasliceOpPath,
            assetIds,
        });
    }

    throw new Error('Execution requires an assignment of "execution_controller" or "worker"');
};
