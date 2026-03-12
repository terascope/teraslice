import { ElasticsearchTestHelpers, Client } from '@terascope/opensearch-client';
import { helmfileDestroy, showState } from '@terascope/scripts';
import fse from 'fs-extra';
import { config } from './config.js';
import { tearDown } from './docker-helpers.js';
import signale from './signale.js';

const {
    KEEP_OPEN, CONFIG_PATH, ASSETS_PATH, TEST_INDEX_PREFIX,
    TEST_PLATFORM, ROOT_CERT_PATH, CLUSTER_NAME, TERASLICE_PORT
} = config;

const { cleanupIndex, makeClient } = ElasticsearchTestHelpers;

async function getClient(client?: Client) {
    if (client) return client;
    return makeClient(ROOT_CERT_PATH);
}

export async function teardown(testClient?: Client) {
    if (KEEP_OPEN) {
        return;
    }

    const client = await getClient(testClient);

    const errors = [];

    try {
        if (TEST_PLATFORM === 'kubernetesV2') {
            await showState(TERASLICE_PORT, true);
            await helmfileDestroy('teraslice');
            await cleanupIndex(client, `${CLUSTER_NAME}_*`);
        } else {
            await tearDown();
        }
    } catch (err) {
        errors.push(err);
    }

    await cleanupIndex(client, `${TEST_INDEX_PREFIX}*`);
    await cleanupIndex(client, `${CLUSTER_NAME}_*`);

    if (fse.existsSync(CONFIG_PATH)) {
        await fse.remove(CONFIG_PATH).catch((err) => errors.push(err));
    }
    if (fse.existsSync(ASSETS_PATH)) {
        const entries = await fse.readdir(ASSETS_PATH);
        await Promise.all(
            entries
                .filter((entry) => entry !== 'README.md')
                .map((entry) => fse.remove(`${ASSETS_PATH}/${entry}`).catch((err) => errors.push(err)))
        );
    }

    if (errors.length) {
        errors.forEach((err) => signale.error(err));
    }
}
