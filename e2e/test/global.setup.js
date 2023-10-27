'use strict';

const { pDelay } = require('@terascope/utils');
const {
    deployK8sTeraslice,
    setAliasAndBaseAssets
} = require('@terascope/scripts');
const fse = require('fs-extra');
const TerasliceHarness = require('./teraslice-harness');
const globalTeardown = require('./global.teardown');
const { dockerUp } = require('./docker-helpers');
const signale = require('./signale');
const setupTerasliceConfig = require('./setup-config');
const downloadAssets = require('./download-assets');
const { CONFIG_PATH, ASSETS_PATH, TEST_PLATFORM } = require('./config');

module.exports = async () => {
    const teraslice = new TerasliceHarness();
    await teraslice.init();

    await globalTeardown(teraslice.client);
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
        await deployK8sTeraslice(); // here
        await teraslice.waitForTeraslice();
        await setAliasAndBaseAssets();
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
