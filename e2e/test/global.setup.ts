import { pDelay } from '@terascope/utils';
import {
    deployK8sTeraslice, setAliasAndBaseAssets
} from '@terascope/scripts';
import fse from 'fs-extra';
import { TerasliceHarness } from './teraslice-harness.js';
import { dockerUp } from './docker-helpers.js';
import signale from './signale.js';
import setupTerasliceConfig from './setup-config.js';
import { downloadAssets } from './download-assets.js';
import {
    CONFIG_PATH, ASSETS_PATH, TEST_PLATFORM,
    TERASLICE_PORT
} from './config.js';
import { teardown } from './teardown.js';

export default async () => {
    const teraslice = new TerasliceHarness();
    await teraslice.init();

    await teardown(teraslice.client);
    await teraslice.resetLogs();

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

    if (TEST_PLATFORM === 'kubernetes') {
        await deployK8sTeraslice(TERASLICE_PORT);
        await teraslice.waitForTeraslice();
        await setAliasAndBaseAssets(TERASLICE_PORT);
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
