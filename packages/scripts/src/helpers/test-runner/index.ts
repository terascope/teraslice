import ms from 'ms';
import path from 'path';
import {
    debugLogger,
    chunk,
    TSError,
    getFullErrorStack,
} from '@terascope/utils';
import {
    writePkgHeader,
    writeHeader,
    formatList,
    getRootDir,
    getRootInfo,
    getAvailableTestSuites,
} from '../misc';
import { ensureServices, pullServices } from './services';
import { PackageInfo } from '../interfaces';
import { TestOptions, RunSuiteResult, CleanupFN } from './interfaces';
import {
    runJest,
    dockerTag,
} from '../scripts';
import * as utils from './utils';
import signale from '../signale';
import { getE2EDir } from '../packages';
import { buildDevDockerImage } from '../publish/utils';
import { isCI } from '../config';

const logger = debugLogger('ts-scripts:cmd:test');

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    logger.info('running tests with options', options);
    let result: RunSuiteResult = {
        cleanup: () => {},
        errors: [],
    };

    try {
        result = await _runTests(pkgInfos, options);
    } catch (err) {
        result.errors = [getFullErrorStack(err)];
    }

    let errorMsg = '';
    if (result.errors.length > 1) {
        errorMsg = `Multiple Test Failures:${formatList(result.errors)}`;
    } else if (result.errors.length === 1) {
        ([errorMsg] = result.errors);
    }

    if (result.errors.length) {
        signale.error(`\n${errorMsg}`);
    }

    if (options.keepOpen) {
        await new Promise((resolve) => {
            let timeoutId: any;
            signale.info('keeping the tests open so the services don\'t shutdown, use ctrl-c to exit.');

            function done() {
                clearTimeout(timeoutId);
                process.removeListener('SIGINT', done);
                process.removeListener('SIGTERM', done);
                resolve();
            }

            timeoutId = setTimeout(done, ms('4 hour'));
            process.once('SIGINT', done);
            process.once('SIGTERM', done);
        });
    }

    try {
        await result.cleanup();
    } catch (err) {
        signale.warn(err, 'cleanup error');
    }

    if (result.errors.length) {
        const exitCode = (process.exitCode || 0) > 0 ? process.exitCode : 1;
        process.exit(exitCode);
    } else {
        process.exit(0);
    }
}

async function _runTests(pkgInfos: PackageInfo[], options: TestOptions): Promise<RunSuiteResult> {
    if (options.suite === 'e2e') {
        return runE2ETest(options);
    }

    const filtered = utils.filterBySuite(pkgInfos, options);
    if (!filtered.length) {
        signale.warn('No tests found.');
        return { cleanup() {}, errors: [] };
    }

    const cleanups: (() => void)[] = [];
    const availableSuites = getAvailableTestSuites();
    const grouped = utils.groupBySuite(filtered, availableSuites, options);

    const errors: string[] = [];
    for (const [suite, pkgs] of Object.entries(grouped)) {
        if (!pkgs.length || suite === 'e2e') continue;

        try {
            const result = await runTestSuite(suite, pkgs, options);
            cleanups.push(result.cleanup);
            if (result.errors.length) {
                errors.push(...result.errors);
                if (options.bail) {
                    break;
                }
            }
        } catch (err) {
            errors.push(getFullErrorStack(err));
            break;
        }
    }

    return {
        async cleanup() {
            await Promise.all(cleanups);
        },
        errors,
    };
}

async function runTestSuite(
    suite: string,
    pkgInfos: PackageInfo[],
    options: TestOptions
): Promise<RunSuiteResult> {
    if (suite === 'e2e') {
        return { cleanup() {}, errors: [] };
    }

    const errors: string[] = [];

    // jest or our tests have a memory leak, limiting this seems to help
    const MAX_CHUNK_SIZE = isCI ? 7 : 10;
    const CHUNK_SIZE = options.debug ? 1 : MAX_CHUNK_SIZE;

    if (options.watch && pkgInfos.length > MAX_CHUNK_SIZE) {
        throw new Error(
            `Running more than ${MAX_CHUNK_SIZE} packages will cause memory leaks`
        );
    }

    const chunked = chunk(pkgInfos, CHUNK_SIZE);

    // don't log unless this useful information (more than one package)
    if (chunked.length > 1 && chunked[0].length > 1) {
        writeHeader(`Running test suite "${suite}"`, false);
    }

    let cleanup: CleanupFN = await ensureServices(options.forceSuite || suite, options);

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
        args.projects = pkgs.map((pkgInfo) => path.join('packages', pkgInfo.folderName));

        try {
            await runJest(getRootDir(), args, env, options.jestArgs, options.debug);
        } catch (err) {
            errors.push(err.message);

            const teardownPkgs = pkgs.map((pkg) => ({
                name: pkg.name,
                dir: pkg.dir,
                suite: pkg.terascope.testSuite
            }));

            if (options.keepOpen) {
                const prevCleanup = cleanup;
                cleanup = async () => {
                    await prevCleanup();
                    options.keepOpen = false;
                    await utils.globalTeardown(options, teardownPkgs);
                };
            } else {
                await utils.globalTeardown(options, teardownPkgs);
            }

            if (options.bail) {
                break;
            }
        } finally {
            if (options.reportCoverage) {
                await utils.reportCoverage(suite, chunkIndex);
            }
        }
    }

    if (!options.keepOpen) {
        await cleanup();
        cleanup = () => {};
    }

    signale.timeEnd(timeLabel);

    return { errors, cleanup };
}

async function runE2ETest(options: TestOptions): Promise<RunSuiteResult> {
    let cleanup: CleanupFN = () => {};
    const errors: string[] = [];
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
        errors.push(getFullErrorStack(err));
    }

    try {
        cleanup = await ensureServices(suite, options);
    } catch (err) {
        errors.push(getFullErrorStack(err));
    }

    if (!errors.length) {
        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);
        startedTest = true;

        const env = printAndGetEnv(suite, options);

        try {
            await runJest(
                e2eDir,
                utils.getArgs(options),
                env,
                options.jestArgs,
                options.debug
            );
        } catch (err) {
            errors.push(err.message);
        }

        signale.timeEnd(timeLabel);
    }

    if (startedTest && !options.keepOpen) {
        try {
            await utils.logE2E(e2eDir, errors.length > 0);
        } catch (err) {
            signale.error(
                new TSError(err, {
                    reason: `Writing the "${suite}" logs failed`,
                })
            );
        }
    }

    if (startedTest && errors.length) {
        if (options.keepOpen) {
            const prevCleanup = cleanup;
            cleanup = async () => {
                await prevCleanup();
                options.keepOpen = false;
                await utils.globalTeardown(options, [{
                    name: suite,
                    dir: e2eDir,
                    suite,
                }]);
            };
        } else {
            await utils.globalTeardown(options, [{
                name: suite,
                dir: e2eDir,
                suite,
            }]);
        }
    }

    return { errors, cleanup };
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
