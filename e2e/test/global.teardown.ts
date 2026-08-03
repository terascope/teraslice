import { teardown } from './teardown.js';
import { deleteCompatTestAssets } from './source-assets.js';
import { config } from './config.js';

export default async () => {
    await teardown();

    // Assets built from source are for this run only -- the autoload directory
    // and the assets volume both hold released bundles otherwise, and a leftover
    // build would change what every later run tests.
    //
    // After teardown, so the containers are down before their assets volume is
    // touched, and skipped entirely under KEEP_OPEN, which exists to leave a run
    // exactly where it stopped. The prune in global.setup picks those up.
    if (!config.KEEP_OPEN) {
        deleteCompatTestAssets();
    }
};
