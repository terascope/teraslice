import fs from 'node:fs';
import path from 'node:path';
import { parseJSON, castArray } from '@terascope/core-utils';
import { Terafoundation } from '@terascope/types';
import {
    Context, ValidatedJobConfig, ExecutionConfig,
    OpConfig, GetClientConfig,
} from './interfaces/index.js';
import { ExecutionContextAPI } from './execution-context/index.js';

/** Get the first opConfig from an operation name */
export function getOpConfig(job: ValidatedJobConfig, name: string): OpConfig | undefined {
    return job.operations.find((op: OpConfig) => op._op.includes(name));
}

/* Get the asset path from a asset name or ID */
export async function getAssetPath(
    assetDirs: string[],
    assets: string[],
    name: string
): Promise<string> {
    if (assetDirs.length === 0) {
        throw new Error('No asset_directory has been configured, cannot get asset path');
    }

    const assetIds = assets || [];

    if (!name) {
        throw new Error('Invalid asset name');
    }

    for (const assetDir of assetDirs) {
        if (name.length === 40) {
            const assetPath = path.join(assetDir, name);
            if (fs.existsSync(assetDir)) return assetPath;
        }

        const [assetName] = name.split(':').map((s) => s.trim());

        for (const id of assetIds) {
            const rawAssetJSON = fs.readFileSync(path.join(assetDir, id, 'asset.json'));
            const assetJSON: AssetJSON = parseJSON(rawAssetJSON);
            if (assetJSON.name === assetName) {
                return path.join(assetDir, id);
            }
        }
    }

    throw new Error(`Unable to find asset "${name}"`);
}

interface AssetJSON {
    name: string;
    version: string;
}

/*
 * This will request a connection based on the 'connection' attribute of
 * an opConfig. Used to create new client types for elasticsearch, not for use
 * for other connection types other than elasticsearch-next
 */
export async function getClient(
    context: Context,
    config: GetClientConfig,
    type: string
): Promise<any> {
    const clientConfig: Terafoundation.ConnectionConfig = {
        type,
        cached: true,
        endpoint: 'default',
    };

    if (config && config.connection) {
        clientConfig.endpoint = config.connection || 'default';
        const isCached = config.connection_cache != null;
        clientConfig.cached = isCached ? config.connection_cache : true;
    } else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }

    const { client } = await context.apis.foundation.createClient(clientConfig);
    return client;
}

export function registerApis(
    context: Context,
    job: ValidatedJobConfig | ExecutionConfig,
    assetIds?: string[]
): void {
    const cleanupApis = ['op_runner', 'executionContext', 'job_runner', 'assets'];

    for (const api of cleanupApis) {
        if (context.apis[api] != null) {
            delete context.apis[api];
        }
    }

    context.apis.registerAPI('executionContext', new ExecutionContextAPI(context, job as ExecutionConfig));

    context.apis.registerAPI('op_runner', {
        getClient(config: GetClientConfig, type: string): Promise<{ client: any }> {
            return getClient(context, config, type);
        },
        // For backward compatibility, but it will not show up on the type
        getClientAsync(config: GetClientConfig, type: string): Promise<{ client: any }> {
            return getClient(context, config, type);
        },
    });

    context.apis.registerAPI('job_runner', {
        getOpConfig(name: string): OpConfig | undefined {
            return getOpConfig(job, name);
        },
    });

    const assetDir = castArray<string>(context.sysconfig.teraslice.assets_directory);

    context.apis.registerAPI('assets', {
        getPath(name: string): Promise<string> {
            return getAssetPath(assetDir, assetIds || job.assets, name);
        },
    });
}
