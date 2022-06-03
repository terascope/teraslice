'use strict';

const { Client } = require('elasticsearch');
const opensearch = require('@opensearch-project/opensearch');
const elasticsearch6 = require('elasticsearch6');
const elasticsearch7 = require('elasticsearch7');
const elasticsearch8 = require('elasticsearch8');
const { pDelay } = require('@terascope/utils');
const elasticAPI = require('../../index');

const {
    ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION,
    ELASTICSEARCH_VERSION, OPENSEARCH_HOST,
} = require('./config');

const majorVersion = Number(ELASTICSEARCH_VERSION.charAt(0));

const isLegacyTest = process.env.LEGACY_CLIENT != null;
const isOpensearchTest = process.env.TEST_OPENSEARCH != null;

const isES6ClientTest = !isOpensearchTest && majorVersion === 6;
const isES7ClientTest = !isOpensearchTest && majorVersion === 7;
const isES8ClientTest = !isOpensearchTest && majorVersion === 8;

async function makeClient() {
    const node = ELASTICSEARCH_HOST;

    if (isLegacyTest) {
        return new Client({
            host: node,
            log: 'error',
            apiVersion: ELASTICSEARCH_API_VERSION,
        });
    }

    if (isOpensearchTest) {
        return new opensearch.Client({
            node: OPENSEARCH_HOST
        });
    }

    if (isES6ClientTest) {
        return new elasticsearch6.Client({
            node
        });
    }

    if (isES7ClientTest) {
        return new elasticsearch7.Client({
            node
        });
    }

    if (isES8ClientTest) {
        return new elasticsearch8.Client({
            node
        });
    }

    throw new Error('Invalid config, cannot determine what test type is being executed');
}

function formatUploadData(
    index, data
) {
    const results = [];

    data.forEach((record) => {
        const meta = { _index: index };

        if (!isES8ClientTest) {
            meta._type = '_doc';
        }

        results.push({ index: meta }, record);
    });

    return results;
}

async function constrictQueue(client) {
    const settings = {
        persistent: {
            'thread_pool.write.queue_size': '2'
        }
    };

    if (isES8ClientTest) {
        return client.cluster.putSettings(settings);
    }

    return client.cluster.putSettings({ body: settings });
}

async function waitForData(
    client, index, count, logger, timeout = 5000
) {
    const esClient = elasticAPI(client, logger);
    const failTestTime = Date.now() + timeout;

    return new Promise((resolve, reject) => {
        async function checkIndex() {
            if (failTestTime <= Date.now()) reject(new Error('Could not find count in allotted time'));
            await pDelay(100);
            try {
                const indexCount = await esClient.count({ index, q: '*' });
                if (count === indexCount) return resolve();
            } catch (err) {
                return reject(err);
            }

            return checkIndex();
        }

        checkIndex();
    });
}

async function cleanupIndex(
    client, index
) {
    await client.indices
        .delete({
            index,
            requestTimeout: 3000,
        })
        .catch(() => {});
}

module.exports = {
    makeClient,
    constrictQueue,
    waitForData,
    cleanupIndex,
    formatUploadData
};
