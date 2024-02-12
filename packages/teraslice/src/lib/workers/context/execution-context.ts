import {
    makeExecutionContext as makeEx, Context, ExecutionConfig,
    ExecutionContextConfig
} from '@terascope/job-components';
import { terasliceOpPath } from '../../config/index.js';
import { spawnAssetLoader } from '../assets/spawn.js';

export async function makeExecutionContext(
    context: Context,
    executionConfig: ExecutionConfig
) {
    const assetIds = await spawnAssetLoader(executionConfig.assets, context);

    const config: ExecutionContextConfig = {
        context,
        executionConfig,
        terasliceOpPath,
        assetIds,
    };

    return makeEx(config);
}
