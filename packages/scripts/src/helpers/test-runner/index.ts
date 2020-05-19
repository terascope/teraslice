import {
    debugLogger,
    chunk,
    TSError,
    isCI,
    pMap
} from '@terascope/utils';
import {
    writePkgHeader,
    writeHeader,
    getRootDir,
    getRootInfo,
    getAvailableTestSuites,
} from '../misc';
import { ensureServices, pullServices } from './services';
import { PackageInfo } from '../interfaces';
import { TestOptions } from './interfaces';
import {
    runJest,
    dockerTag,
} from '../scripts';
import * as utils from './utils';
import signale from '../signale';
import { getE2EDir } from '../packages';
import { buildDevDockerImage } from '../publish/utils';
import { TestTracker } from './tracker';

const logger = debugLogger('ts-scripts:cmd:test');

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    const tracker = new TestTracker(options);

    logger.info('running tests with options', options);

    try {
        await _runTests(pkgInfos, options, tracker);
    } catch (err) {
        tracker.addError(err);
    } finally {
        tracker.finish();
    }
}

async function _runTests(
    pkgInfos: PackageInfo[], options: TestOptions, tracker: TestTracker
): Promise<void> {
    if (options.suite?.includes('e2e')) {
        await runE2ETest(options, tracker);
        return;
    }

    const filtered = utils.filterBySuite(pkgInfos, options);
    if (!filtered.length) {
        signale.warn('No tests found.');
        return;
    }

    const availableSuites = getAvailableTestSuites();
    const grouped = utils.groupBySuite(filtered, availableSuites, options);

    for (const [suite, pkgs] of Object.entries(grouped)) {
        if (!pkgs.length || suite === 'e2e') continue;

        try {
            await runTestSuite(suite, pkgs, options, tracker);
            if (tracker.hasErrors()) {
                if (options.bail || isCI) {
                    break;
                }
            }
        } catch (err) {
            tracker.addError(err);
            break;
        }
    }
}

async function runTestSuite(
    suite: string,
    pkgInfos: PackageInfo[],
    options: TestOptions,
    tracker: TestTracker,
): Promise<void> {
    if (suite === 'e2e') return;

    // jest or our tests have a memory leak, limiting this seems to help
    const MAX_CHUNK_SIZE = isCI ? 7 : 10;
    const CHUNK_SIZE = options.debug ? 1 : MAX_CHUNK_SIZE;

    if (options.watch && pkgInfos.length > MAX_CHUNK_SIZE) {
        throw new Error(
            `Running more than ${MAX_CHUNK_SIZE} packages will cause memory leaks`
        );
    }

    tracker.expected += pkgInfos.length;
    const chunked = chunk(pkgInfos, CHUNK_SIZE);

    // don't log unless this useful information (more than one package)
    if (chunked.length > 1 && chunked[0].length > 1) {
        writeHeader(`Running test suite "${suite}"`, false);
    }

    const cleanupKeys: string[] = [`${suite}:services`];

    tracker.addCleanup(
        `${suite}:services`,
        await ensureServices(options.forceSuite || suite, options)
    );

    const timeLabel = `test suite "${suite}"`;
    signale.time(timeLabel);

    const env = printAndGetEnv(suite, options);

    let chunkIndex = -1;
    for (const pkgs of chunked) {
        chunkIndex++;

        if (!pkgs.length) continue;
        if (pkgs.length === 1) {
            writePkgHeader('Running test', pkgs, false);
        } else {
            writeHeader(`Running batch of ${pkgs.length} tests`, false);
        }

        const args = utils.getArgs(options);
        args.projects = pkgs.map((pkgInfo) => pkgInfo.relativeDir);

        tracker.started += pkgs.length;
        try {
            await runJest(getRootDir(), args, env, options.jestArgs, options.debug);
            tracker.ended += pkgs.length;
        } catch (err) {
            tracker.ended += pkgs.length;
            tracker.addError(err.message);

            const teardownPkgs = pkgs.map((pkg) => ({
                name: pkg.name,
                dir: pkg.dir,
                suite: pkg.terascope.testSuite
            }));

            const cleanupKey = `${suite}:teardown:${pkgs.map((pkg) => pkg.folderName).join(',')}`;
            cleanupKeys.push(cleanupKey);
            tracker.addCleanup(cleanupKey, async () => {
                options.keepOpen = false;
                await utils.globalTeardown(options, teardownPkgs);
            });

            if (options.bail || isCI) {
                signale.error('Bailing out of tests due to error');
                break;
            }
        } finally {
            if (options.reportCoverage) {
                await utils.reportCoverage(suite, chunkIndex);
            }
        }
    }

    if (!options.keepOpen) {
        await pMap(cleanupKeys, (key) => tracker.runCleanupByKey(key));
    }

    signale.timeEnd(timeLabel);
}

async function runE2ETest(
    options: TestOptions, tracker: TestTracker
): Promise<void> {
    tracker.expected++;

    const suite = 'e2e';
    let startedTest = false;

    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }

    const rootInfo = getRootInfo();
    const [registry] = rootInfo.terascope.docker.registries;
    const e2eImage = `${registry}:e2e`;

    if (isCI) {
        // pull the services first in CI
        await pullServices(suite, options);
    }

    try {
        const devImage = await buildDevDockerImage();
        await dockerTag(devImage, e2eImage);
    } catch (err) {
        tracker.addError(err);
    }

    try {
        tracker.addCleanup(
            'e2e:services',
            await ensureServices(suite, options)
        );
    } catch (err) {
        tracker.addError(err);
    }

    if (!tracker.hasErrors()) {
        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);
        startedTest = true;

        const env = printAndGetEnv(suite, options);

        tracker.started++;
        try {
            await runJest(
                e2eDir,
                utils.getArgs(options),
                env,
                options.jestArgs,
                options.debug
            );
            tracker.ended++;
        } catch (err) {
            tracker.ended++;
            tracker.addError(err.message);
        }

        signale.timeEnd(timeLabel);
    }

    if (!startedTest) return;

    if (!options.keepOpen) {
        try {
            await utils.logE2E(e2eDir, tracker.hasErrors());
        } catch (err) {
            signale.error(
                new TSError(err, {
                    reason: `Writing the "${suite}" logs failed`,
                })
            );
        }
    }

    if (tracker.hasErrors()) {
        tracker.addCleanup('e2e:teardown', async () => {
            options.keepOpen = false;
            await utils.globalTeardown(options, [{
                name: suite,
                dir: e2eDir,
                suite,
            }]);
        });
    }
}

function printAndGetEnv(suite: string, options: TestOptions) {
    const env = utils.getEnv(options, suite);
    if (options.debug || options.trace || isCI) {
        const envStr = Object
            .entries(env)
            .filter(([_, val]) => val != null && val !== '')
            .map(([key, val]) => `${key}: "${val}"`)
            .join(', ');

        signale.debug(`Setting ${suite} test suite env to ${envStr}`);
    }
    return env;
}
