import { getFullErrorStack, pDelay } from '@terascope/utils';
import type { Context } from '@terascope/job-components';
import { AssetLoader } from './loader';
import { makeTerafoundationContext } from '../context/terafoundation-context';
import { safeDecode } from '../../utils/encoding_utils';

async function loadAssets(context: Context, assets?: string[]) {
    const assetLoader = new AssetLoader(context, assets);
    return assetLoader.load();
}

if (require.main === module) {
    const context = makeTerafoundationContext() as unknown as Context;
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
