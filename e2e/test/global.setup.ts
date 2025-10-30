import { pDelay } from '@terascope/utils';
import fse from 'fs-extra';
import { helmfileCommand, K8s, setAlias } from '@terascope/scripts';
import { TerasliceHarness } from './teraslice-harness.js';
import { dockerUp } from './docker-helpers.js';
import signale from './signale.js';
import setupTerasliceConfig from './setup-config.js';
import { downloadAssets, loadAssetCache } from './download-assets.js';
import {
    CONFIG_PATH, ASSETS_PATH, TEST_PLATFORM,
    TERASLICE_PORT, KIND_CLUSTER, USE_HELMFILE
} from './config.js';
import { teardown } from './teardown.js';

export default async () => {
    const teraslice = new TerasliceHarness();
    await teraslice.init();

    await teardown(teraslice.client);
    if (TEST_PLATFORM === 'native') {
        await teraslice.resetLogs();
    }

    process.stdout.write('\n');
    signale.time('global setup');

    if (!fse.existsSync(CONFIG_PATH)) {
        await fse.emptyDir(CONFIG_PATH);
    }
    if (!fse.existsSync(ASSETS_PATH)) {
        await fse.emptyDir(ASSETS_PATH);
    }

    await Promise.all([
        fse.ensureDir(ASSETS_PATH),
        fse.ensureDir(CONFIG_PATH),
    ]);

    // Try to load in the cache before trying to download
    loadAssetCache();

    if (TEST_PLATFORM === 'kubernetesV2') {
        await downloadAssets();
        if (USE_HELMFILE) {
            await helmfileCommand('sync', TEST_PLATFORM);
        } else {
            const k8s = new K8s(TERASLICE_PORT, KIND_CLUSTER);
            await k8s.deployK8sTeraslice(TEST_PLATFORM, true, false);
        }
        await teraslice.waitForTeraslice();
        await setAlias(TERASLICE_PORT);
    } else {
        await Promise.all([setupTerasliceConfig(), downloadAssets()]);
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
