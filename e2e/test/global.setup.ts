import path from 'node:path';
import { pDelay } from '@terascope/core-utils';
import fse from 'fs-extra';
import { helmfileCommand, setAlias } from '@terascope/scripts';
import { TerasliceHarness } from './teraslice-harness.js';
import { dockerUp } from './docker-helpers.js';
import signale from './signale.js';
import setupTerasliceConfig from './setup-config.js';
import { downloadAssets, loadAssetCache } from './download-assets.js';
import {
    buildAssetsFromSource, getSourceAssetBuilds, deleteCompatTestAssets
} from './source-assets.js';
import { config } from './config.js';
import { teardown } from './teardown.js';

const {
    CONFIG_PATH, ASSETS_PATH, TEST_PLATFORM,
    TERASLICE_PORT, STERN_LOGS, FILE_LOGGING, LOG_PATH
} = config;

export default async () => {
    const teraslice = new TerasliceHarness();
    await teraslice.init();

    // teardown() below runs `compose run`, so config dir must exist first.
    await Promise.all([
        fse.ensureDir(ASSETS_PATH),
        fse.ensureDir(CONFIG_PATH),
    ]);

    await teardown(teraslice.client);
    if (TEST_PLATFORM === 'native') {
        await teraslice.resetLogs();
    }

    process.stdout.write('\n');
    signale.time('global setup');

    // The teraslice container runs as non-root (uid 10001) and writes into these
    // bind-mounted dirs (assets, and the host-owned log file when file logging is on).
    // Make them writable regardless of host owner, else it hits EACCES at startup.
    await fse.chmod(ASSETS_PATH, 0o777);
    if (FILE_LOGGING) {
        const logDir = path.dirname(LOG_PATH);
        await fse.ensureDir(logDir);
        await fse.chmod(logDir, 0o777);
        if (fse.existsSync(LOG_PATH)) {
            await fse.chmod(LOG_PATH, 0o666);
        }
    }

    const sourceAssetBuilds = getSourceAssetBuilds();
    deleteCompatTestAssets();

    // Try to load in the cache before trying to download
    loadAssetCache();

    await buildAssetsFromSource(sourceAssetBuilds);
    await Promise.all([setupTerasliceConfig(), downloadAssets()]);

    if (TEST_PLATFORM === 'kubernetesV2') {
        // The services (opensearch, ceph, kafka...) are already deployed by the
        // test runner; teardown() above only destroys the teraslice release. So
        // re-sync just teraslice. Re-applying the whole stack would re-apply the
        // Rook CephCluster CR, which the operator now co-owns -> server-side-apply
        // conflict. Scoping to teraslice avoids that (and is faster).
        await helmfileCommand('sync', TEST_PLATFORM, undefined, STERN_LOGS, true, 'app=teraslice');
        await teraslice.waitForTeraslice();
        await setAlias(TERASLICE_PORT);
    } else {
        await dockerUp();
        await teraslice.waitForTeraslice();
    }

    await pDelay(2000);
    await teraslice.resetState();

    try {
        await teraslice.generateTestData();
    } catch (err) {
        signale.error('Setup failed, `docker-compose logs` may provide clues');
        signale.error(err);
        process.exit(1);
    }

    signale.timeEnd('global setup');
};
