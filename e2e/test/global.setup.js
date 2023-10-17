'use strict';

const { pDelay } = require('@terascope/utils');
const { getE2eK8sDir } = require('@terascope/scripts');
const fse = require('fs-extra');
const TerasliceHarness = require('./teraslice-harness');
const globalTeardown = require('./global.teardown');
const { dockerUp } = require('./docker-helpers');
const signale = require('./signale');
const setupTerasliceConfig = require('./setup-config');
const downloadAssets = require('./download-assets');
const { CONFIG_PATH, ASSETS_PATH } = require('./config');
const { createKindCluster, destroyKindCluster } = require('../../packages/scripts/src/helpers/scripts.ts');// FIXME: is this right?

module.exports = async () => {
    const teraslice = new TerasliceHarness();
    await teraslice.init();// create TS and ES or OS clients

    if (process.env.TEST_PLATFORM === 'kubernetes') {
        await destroyKindCluster();
    } else {
        await globalTeardown(teraslice.client); // docker compose down and ES or OS teardown
    }
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

    await Promise.all([setupTerasliceConfig(), downloadAssets()]);

    if (process.env.TEST_PLATFORM === 'kubernetes') {
        const e2eK8sDir = getE2eK8sDir();
        await createKindCluster(e2eK8sDir, 'kindConfig.yaml');
    } else {
        await dockerUp(); // create TS master and workers from docker-compose file
    }
    await teraslice.waitForTeraslice();
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
