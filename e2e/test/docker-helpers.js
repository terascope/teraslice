'use strict';

const { Compose } = require('@terascope/docker-compose-js');
const ms = require('ms');
const semver = require('semver');
const { DEFAULT_WORKERS, NODE_VERSION } = require('./config');
const signale = require('./signale');

const compose = new Compose('docker-compose.yml');

async function scaleWorkers(workerToAdd = 0) {
    const count = DEFAULT_WORKERS + workerToAdd;
    return scaleService('teraslice-worker', count);
}

async function scaleService(service, count) {
    return compose.up({
        scale: `${service}=${count}`,
        timeout: 30,
        'no-recreate': '',
        'no-build': ''
    });
}

async function tearDown() {
    return compose.down({
        'remove-orphans': '',
        volumes: ''
    });
}

async function dockerUp() {
    const startTime = Date.now();
    signale.pending('Bringing Docker environment up...');

    await compose.up({
        'force-recreate': ''
    });
    signale.success('Docker environment is good to go', getElapsed(startTime));

    let e2eNodeVersion = await compose.runCmd('exec', undefined, 'teraslice-master', 'node', '--version');
    signale.info('Teraslice node version: ', e2eNodeVersion);
    const parsedVersion = semver.parse(e2eNodeVersion);
    if (parsedVersion?.version) {
        e2eNodeVersion = parsedVersion.version;
    }
    if (e2eNodeVersion !== NODE_VERSION) {
        signale.error(`Expected node version(${NODE_VERSION}) does not match teraslice node version(${e2eNodeVersion})`);
        process.exit(1);
    }
}

function getElapsed(time) {
    const elapsed = Date.now() - time;
    return `took ${ms(elapsed)}`;
}

module.exports = {
    scaleWorkers,
    scaleService,
    tearDown,
    dockerUp,
    getElapsed
};
