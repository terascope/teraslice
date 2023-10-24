'use strict';

const { pDelay } = require('@terascope/utils');
const {
    getE2eK8sDir,
    deployK8sTeraslice,
    setAlias,
    deployAssets
} = require('@terascope/scripts');
const fse = require('fs-extra');
const TerasliceHarness = require('./teraslice-harness');
const globalTeardown = require('./global.teardown');
const { dockerUp } = require('./docker-helpers');
const signale = require('./signale');
const setupTerasliceConfig = require('./setup-config');
const downloadAssets = require('./download-assets');
const { CONFIG_PATH, ASSETS_PATH } = require('./config');

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

    if (process.env.TEST_PLATFORM === 'kubernetes') {
        const e2eK8sDir = getE2eK8sDir();
        await deployK8sTeraslice(e2eK8sDir, 'masterDeployment.yaml');
    } else {
        await Promise.all([setupTerasliceConfig(), downloadAssets()]);
        await dockerUp();
    }

    await teraslice.waitForTeraslice();
    await pDelay(2000);
    await teraslice.resetState();

    if (process.env.TEST_PLATFORM === 'kubernetes') {
        try {
            await setAlias();
            await deployAssets('elasticsearch');
            await deployAssets('standard');
            await deployAssets('kafka');
        } catch (err) {
            signale.error('Setup failed');
            signale.error(err);
            process.exit(1);
        }
    }

    try {
        await teraslice.generateTestData();
    } catch (err) {
        signale.error('Setup failed, `docker-compose logs` may provide clues');
        signale.error(err);
        process.exit(1);
    }

    signale.timeEnd('global setup');
};
