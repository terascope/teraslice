import { makeExecutionContext } from '@terascope/job-components';
import { terasliceOpPath } from '../../config';
import spawnAssetLoader from '../assets/spawn';

export default async function _makeExecutionContext(context, executionConfig) {
    const assetIds = await spawnAssetLoader(executionConfig.assets, context);

    return makeExecutionContext({
        context,
        executionConfig,
        terasliceOpPath,
        assetIds,
    });
};
