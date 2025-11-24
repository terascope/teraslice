import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork } from 'node:child_process';
import { isEmpty, get, has } from '@terascope/core-utils';
import type { Context } from '@terascope/job-components';
import { makeLogger } from '../helpers/terafoundation.js';
import { safeEncode } from '../../utils/encoding_utils.js';

const filePath = fileURLToPath(new URL('.', import.meta.url));
const loaderPath = path.join(filePath, './loader-executable.js');

interface AssetMessage {
    success: boolean;
    assetIds: string[];
}

export async function spawnAssetLoader(
    assets: string[],
    context?: Context
): Promise<string[]> {
    // if assets is empty return early
    if (isEmpty(assets)) {
        return [];
    }

    // if the assets are ids and are already loaded, return early
    if (context) {
        const assetDir = get(context, 'sysconfig.teraslice.assets_directory') as string;

        const alreadyExists = assets.every((id: string) => {
            const assetPath = path.join(assetDir, id);
            return fs.existsSync(assetPath);
        });

        if (alreadyExists) {
            const logger = makeLogger(context, 'asset_loader');
            logger.debug('assets already loaded...');
            return assets;
        }
    }

    return new Promise((resolve, reject) => {
        let message: AssetMessage | undefined;

        const child = fork(loaderPath, process.argv, {
            stdio: 'inherit',
            env: Object.assign({}, process.env, {
                ASSETS: safeEncode(assets)
            })
        });

        child.on('message', (msg: AssetMessage) => {
            if (has(msg, 'success')) {
                message = msg;
            }
        });

        child.on('close', (code) => {
            const isSuccess = get(message, 'success', false) && code === 0;

            if (!isSuccess) {
                const errMsg = get(message, 'error', `exit code ${code}`);
                const errOOM = 'If running out of memory, try consider increasing the memory allocation for the process by adding/modifying the "memory_execution_controller" or "resources_limits_memory" (for workers) field in the job file.';
                const error = new Error(`Failure to get assets, caused by ${errMsg}\n${errOOM}`);
                reject(error);
            } else {
                resolve(get(message, 'assetIds', []));
            }
        });
    });
}
