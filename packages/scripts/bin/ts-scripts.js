#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPortInUse, getAvailablePort, toBoolean } from '@terascope/utils';
import signale from '../dist/src/helpers/signale.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// this path.join is only used for pkg asset injection
path.join(dirname, '../package.json');

// An object that contains all possible port environment variables used in scripts
// NOTE: The defaults set here override the defaults in the scripts/src/helpers/config.ts file
const allPorts = {
    TEST_ELASTICSEARCH: {
        ELASTICSEARCH_PORT: process.env.ELASTICSEARCH_PORT || '49200'
    },
    TEST_RESTRAINED_ELASTICSEARCH: {
        RESTRAINED_ELASTICSEARCH_PORT: process.env.RESTRAINED_ELASTICSEARCH_PORT || '49202'
    },
    TEST_KAFKA: {
        KAFKA_PORT: process.env.KAFKA_PORT || '49094',
        ZOOKEEPER_CLIENT_PORT: process.env.ZOOKEEPER_CLIENT_PORT || '42181',
    },
    TEST_MINIO: {
        MINIO_PORT: process.env.MINIO_PORT || '49000',
        MINIO_UI_PORT: process.env.MINIO_UI_PORT || '49001'
    },
    TEST_RABBITMQ: {
        RABBITMQ_PORT: process.env.RABBITMQ_PORT || '45672',
        RABBITMQ_MANAGEMENT_PORT: process.env.RABBITMQ_MANAGEMENT_PORT || '55672',
    },
    TEST_OPENSEARCH: {
        OPENSEARCH_PORT: process.env.OPENSEARCH_PORT || '49210'
    },
    TEST_RESTRAINED_OPENSEARCH: {
        RESTRAINED_OPENSEARCH_PORT: process.env.RESTRAINED_OPENSEARCH_PORT || '49206'
    }
};

// Iterates over the `allports` object to see if any TEST_{SERVICE_NAME} variable is set
for (const [testKey, portsObj] of Object.entries(allPorts)) {
    // We only want to check ports for services that are set to 'true'
    const serviceEnabled = toBoolean(process.env[testKey]);

    if (serviceEnabled) {
        for (const [envVarName, port] of Object.entries(portsObj)) {
            signale.debug(`Checking availability of port ${port}`);

            if (await isPortInUse(Number.parseInt(port))) {
                signale.warn(`port ${port} is in use. Switching ${envVarName} to different port..`);
                const newPort = await getAvailablePort();
                process.env[envVarName] = newPort.toString();
                signale.warn(`${envVarName} env variable now uses port ${newPort}`);
            } else {
                signale.debug(`port ${port} is valid for env variable ${envVarName}`);
            }
        }
    }
}

import('../dist/src/command.js');
