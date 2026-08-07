import { isCI } from '@terascope/core-utils';
import { teardown } from './teardown.js';
import { deleteCompatTestAssets } from './source-assets.js';
import { config } from './config.js';

export default async () => {
    await teardown();

    // Local cleanup of compatibility test assets
    if (!config.KEEP_OPEN && !isCI) {
        deleteCompatTestAssets();
    }
};
