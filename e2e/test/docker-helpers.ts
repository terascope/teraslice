import { Compose } from '@terascope/docker-compose-js';
import ms from 'ms';
import semver from 'semver';
import { config } from './config.js';
import signale from './signale.js';
import { pRetry } from '@terascope/core-utils';

const { DEFAULT_WORKERS, NODE_VERSION } = config;
const compose = new Compose('docker-compose.yml');

export async function scaleWorkers(workerToAdd = 0) {
    const count = DEFAULT_WORKERS + workerToAdd;
    return scaleService('teraslice-worker', count);
}

export async function scaleService(service: string, count: number) {
    return compose.up({
        scale: `${service}=${count}`,
        timeout: 30,
        'no-recreate': '',
        'no-build': ''
    });
}

export async function tearDown() {
    return compose.down({
        'remove-orphans': '',
        volumes: ''
    });
}

export async function dockerUp() {
    const startTime = Date.now();
    signale.pending('Bringing Docker environment up...');

    await compose.up({
        'force-recreate': ''
    });
    signale.success('Docker environment is good to go', getElapsed(startTime));

    const e2eNodeVersion = await pRetry(async () => {
        const version = await compose.runCmd('exec', undefined, 'teraslice-master', 'node', '--version');
        if (version === undefined) {
            throw new Error('Node version check failed to return a result.');
        }
        return version;
    });

    const scriptsNodeVersion = semver.coerce(NODE_VERSION);
    const parsedVersion = semver.parse(e2eNodeVersion);
    signale.info('Teraslice node version: ', parsedVersion?.version);

    // Check env NODE_VERSION for how many "." are present
    switch (NODE_VERSION?.replace(/[^.]/g, '').length) {
        case 0:
            if (parsedVersion?.major !== scriptsNodeVersion?.major) {
                const scriptV = `${scriptsNodeVersion?.major}`;
                const imageV = `${parsedVersion?.major}`;
                signale.error(`Expected node version(${scriptV}) does not match teraslice node version(${imageV})`);
                process.exit(1);
            }
            break;
        case 1:
            if (
                parsedVersion?.major !== scriptsNodeVersion?.major
                || parsedVersion?.minor !== scriptsNodeVersion?.minor
            ) {
                const scriptV = `${scriptsNodeVersion?.major}.${scriptsNodeVersion?.minor}`;
                const imageV = `${parsedVersion?.major}.${parsedVersion?.minor}`;
                signale.error(`Expected node version(${scriptV}) does not match teraslice node version(${imageV})`);
                process.exit(1);
            }
            break;
        case 2:
            if (parsedVersion?.version !== scriptsNodeVersion?.version) {
                signale.error(`Expected node version(${scriptsNodeVersion?.version}) does not match teraslice node version(${parsedVersion?.version})`);
                process.exit(1);
            }
            break;
        default:
            signale.error(`Invalid env variable NODE_VERSION. Got ${NODE_VERSION}`);
            process.exit(1);
    }
}

export function getElapsed(time: number) {
    const elapsed = Date.now() - time;
    return `took ${ms(elapsed)}`;
}
