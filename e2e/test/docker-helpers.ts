import { Compose } from '@terascope/docker-compose-js';
import ms from 'ms';
import { DEFAULT_WORKERS } from './config.js';
import signale from './signale.js';

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
}

export function getElapsed(time: number) {
    const elapsed = Date.now() - time;
    return `took ${ms(elapsed)}`;
}
