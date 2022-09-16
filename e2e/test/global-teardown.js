'use strict';

const { ElasticsearchTestHelpers } = require('elasticsearch-store');
const fse = require('fs-extra');
const { KEEP_OPEN, CONFIG_PATH, ASSETS_PATH } = require('./config');
const { tearDown, TEST_INDEX_PREFIX } = require('./docker-helpers');
const signale = require('./signale');

const { cleanupIndex, makeClient } = ElasticsearchTestHelpers;

async function getClient(client) {
    if (client) return client;
    return makeClient();
}

async function globalTeardown(testClient) {
    const client = await getClient(testClient);

    if (KEEP_OPEN) {
        return;
    }

    const errors = [];

    try {
        await tearDown();
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
