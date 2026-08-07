import { Compose } from '@terascope/docker-compose-js';
import ms from 'ms';
import semver from 'semver';
import { config } from './config.js';
import signale from './signale.js';
import { pRetry } from '@terascope/core-utils';

const { DEFAULT_WORKERS, NODE_VERSION } = config;

// docker-compose.logs.yml is a conditional override that mounts ./logs:/app/logs
// into the teraslice containers. It is only included when FILE_LOGGING is enabled
// since docker-compose has no way to conditionally omit a volume via env var alone.
const composeFiles: string[] = ['docker-compose.yml'];
if (config.FILE_LOGGING) composeFiles.push('docker-compose.logs.yml');
const compose = new Compose(composeFiles);

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

/**
 * Widen the permissions on everything teraslice unpacked into the assets bind
 * mount, so the host can delete it.
 *
 * The teraslice image runs as uid 10001, and global.setup only makes the volume
 * root writable by it -- the `<assetId>` directories it unpacks below that are
 * its own, mode 0755. Removing a file inside one needs write permission on the
 * directory, which the host user does not have, so teardown's cleanup fails with
 * EACCES and the assets directory grows across runs.
 *
 * Only the owner (or root) can chmod those directories, so this runs in a
 * throwaway container off the same service definition -- `run` rather than
 * `exec` so it works whether or not the cluster is still up, which it is not
 * after a run that crashed.
 *
 * Best effort: teardown tolerates what it cannot delete, and a chmod failure is
 * not worth failing a run over.
 */
export async function makeAssetsHostWritable() {
    try {
        await compose.runCmd(
            'run',
            {
                '--rm': null,
                '--no-deps': null,
                '--user': 0,
                '--entrypoint': 'chmod'
            },
            'teraslice-master',
            '-R',
            'a+rwX',
            '/app/assets'
        );
    } catch (err) {
        signale.warn(`Unable to make the assets directory host writable: ${err.message}`);
    }
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
