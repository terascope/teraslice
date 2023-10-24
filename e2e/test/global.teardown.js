'use strict';

const { ElasticsearchTestHelpers } = require('elasticsearch-store');
const { tearDownTerasliceK8s } = require('@terascope/scripts');
const fse = require('fs-extra');
const {
    KEEP_OPEN, CONFIG_PATH, ASSETS_PATH, TEST_INDEX_PREFIX
} = require('./config');
const { tearDown } = require('./docker-helpers');
const signale = require('./signale');

const { cleanupIndex, makeClient } = ElasticsearchTestHelpers;

async function getClient(client) {
    if (client && client.delete) return client;
    return makeClient();
}

async function globalTeardown(testClient) {
    if (KEEP_OPEN) {
        return;
    }

    const client = await getClient(testClient);

    const errors = [];

    try {
        if (process.env.TEST_PLATFORM === 'kubernetes') {
            await tearDownTerasliceK8s();
        } else {
            await tearDown();
        }
    } catch (err) {
        errors.push(err);
    }
    await cleanupIndex(client, `${TEST_INDEX_PREFIX}*`);

    if (fse.existsSync(CONFIG_PATH)) {
        await fse.remove(CONFIG_PATH).catch((err) => errors.push(err));
    }
    if (fse.existsSync(ASSETS_PATH)) {
        await fse.remove(ASSETS_PATH).catch((err) => errors.push(err));
    }

    if (errors.length) {
        errors.forEach((err) => signale.error(err));
    }
}

module.exports = async (client) => {
    await globalTeardown(client);
};
