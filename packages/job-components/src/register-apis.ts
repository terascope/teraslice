import fs from 'fs';
import path from 'path';
import { parseJSON } from '@terascope/utils';
import {
    ConnectionConfig,
    Context,
    ValidatedJobConfig,
    ExecutionConfig,
    OpConfig,
    GetClientConfig,
    WorkerContextAPIs
} from './interfaces';
import { ExecutionContextAPI } from './execution-context';

/** Get the first opConfig from an operation name */
export function getOpConfig(job: ValidatedJobConfig, name: string): OpConfig | undefined {
    return job.operations.find((op: OpConfig) => op._op === name);
}

/* Get the asset path from a asset name or ID */
export async function getAssetPath(
    assetDir: string,
    assets: string[],
    name: string
): Promise<string> {
    if (!assetDir) {
        throw new Error('No asset_directroy has been configured, cannot get asset path');
    }

    const assetIds = assets || [];

    if (!name) {
        throw new Error('Invalid asset name');
    }

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

    throw new Error(`Unable to find asset "${name}"`);
}

interface AssetJSON {
    name: string;
    version: string;
}

/*
 * This will request a connection based on the 'connection' attribute of
 * an opConfig. Intended as a context API endpoint.
 */
export function getClient(context: Context, config: GetClientConfig, type: string): any {
    const clientConfig: ConnectionConfig = {
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

    return context.foundation.getConnection(clientConfig).client;
}

export function registerApis(
    context: Context,
    job: ValidatedJobConfig | ExecutionConfig,
    assetIds?: string[]
): void {
    const cleanupApis: (keyof WorkerContextAPIs)[] = ['op_runner', 'executionContext', 'job_runner', 'assets'];
    for (const api of cleanupApis) {
        if (context.apis[api] != null) {
            delete context.apis[api];
        }
    }

    context.apis.registerAPI('executionContext', new ExecutionContextAPI(context, job as ExecutionConfig));

    context.apis.registerAPI('op_runner', {
        getClient(config: GetClientConfig, type: string): { client: any } {
            return getClient(context, config, type);
        },
    });

    context.apis.registerAPI('job_runner', {
        getOpConfig(name: string): OpConfig | undefined {
            return getOpConfig(job, name);
        },
    });

    const assetDir = context.sysconfig.teraslice.assets_directory;
    context.apis.registerAPI('assets', {
        getPath(name: string): Promise<string> {
            return getAssetPath(assetDir || '', assetIds || job.assets, name);
        },
    });
}
