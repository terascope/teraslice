import {
    defaultAssetBundles,
    downloadWithDelayedRetry,
    filterRelease,
    filterAsset
} from "../dist/test/download-assets.js";
import { downloadRelease } from '@terascope/fetch-github-release';

const promises = defaultAssetBundles.map(({ repo }) => downloadWithDelayedRetry(
    () => downloadRelease(
        'terascope',
        repo,
        '/tmp/teraslice_assets',
        filterRelease,
        undefined,
        true, // Keep assets zipped
        false // Don't disable logging
    ))
);
await Promise.all(promises);


