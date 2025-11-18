import { getFullErrorStack, pDelay } from '@terascope/core-utils';
import type { Context } from '@terascope/job-components';
import { fileURLToPath } from 'node:url';
import { AssetLoader } from './loader.js';
import { makeTerafoundationContext } from '../context/terafoundation-context.js';
import { safeDecode } from '../../utils/encoding_utils.js';

async function loadAssets(context: Context, assets?: string[]) {
    const assetLoader = new AssetLoader(context, assets);
    return assetLoader.load();
}

if (import.meta.url.startsWith('file:')) {
    const modulePath = fileURLToPath(import.meta.url);
    const executePath = process.argv[1];

    if (executePath === modulePath) {
        const context = await makeTerafoundationContext() as unknown as Context;
        const assets = safeDecode(process.env.ASSETS as string);

        (async () => {
            try {
                const assetIds = await loadAssets(context, assets);
                // @ts-expect-error
                process.send({
                    assetIds: assetIds || [],
                    success: true
                });
            } catch (err) {
            // @ts-expect-error
                process.send({
                    error: getFullErrorStack(err),
                    success: false
                });
                process.exitCode = 1;
            } finally {
                await pDelay(500);
                process.exit();
            }
        })();
    }
}
