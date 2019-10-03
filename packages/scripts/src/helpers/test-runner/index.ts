import path from 'path';
import isCI from 'is-ci';
import {
    debugLogger,
    chunk,
    TSError,
    getFullErrorStack
} from '@terascope/utils';
import {
    writePkgHeader,
    writeHeader,
    formatList,
    getRootDir,
    getRootInfo
} from '../misc';
import { ensureServices } from './services';
import { PackageInfo, TestSuite } from '../interfaces';
import { TestOptions } from './interfaces';
import { runJest } from '../scripts';
import * as utils from './utils';
import signale from '../signale';
import { getE2EDir } from '../packages';

const logger = debugLogger('ts-scripts:cmd:test');

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    logger.info('running tests with options', options);
    let errors: string[];

    try {
        errors = await _runTests(pkgInfos, options);
    } catch (err) {
        errors = [getFullErrorStack(err)];
    }

    let errorMsg = '';
    if (errors.length > 1) {
        errorMsg = `Multiple Test Failures:${formatList(errors)}`;
    } else if (errors.length === 1) {
        ([errorMsg] = errors);
    }

    if (errors.length) {
        process.stderr.write('\n\n');
        signale.error(`${errorMsg}`);

        const exitCode = (process.exitCode || 0) > 0 ? process.exitCode : 1;
        process.exit(exitCode);
        return;
    }

    process.exit(0);
}

async function _runTests(pkgInfos: PackageInfo[], options: TestOptions): Promise<string[]> {
    if (options.suite === TestSuite.E2E) {
        return runE2ETest(options);
    }

    const filtered = utils.filterBySuite(pkgInfos, options);
    if (!filtered.length) {
        signale.warn('No tests found.');
        return [];
    }

    const grouped = utils.groupBySuite(filtered, options);

    const errors: string[] = [];
    for (const [suite, pkgs] of Object.entries(grouped)) {
        if (!pkgs.length || suite === TestSuite.E2E) continue;

        try {
            const suiteErrors: string[] = await runTestSuite(suite as TestSuite, pkgs, options);
            if (suiteErrors.length) {
                errors.push(...suiteErrors);
                if (options.bail) {
                    break;
                }
            }
        } catch (err) {
            errors.push(getFullErrorStack(err));
            break;
        }
    }

    return errors;
}

async function runTestSuite(
    suite: TestSuite,
    pkgInfos: PackageInfo[],
    options: TestOptions
): Promise<string[]> {
    if (suite === TestSuite.E2E) return [];
    const errors: string[] = [];

    // jest or our tests have a memory leak, limiting this seems to help
    const MAX_CHUNK_SIZE = isCI ? 5 : 10;
    const CHUNK_SIZE = options.debug ? 1 : MAX_CHUNK_SIZE;

    if (options.watch && pkgInfos.length > MAX_CHUNK_SIZE) {
        throw new Error(
            `Running more than ${MAX_CHUNK_SIZE} packages will cause memory leaks`
        );
    }

    writeHeader(`Running test suite "${suite}"`, false);

    const cleanup = await ensureServices(suite, options);

    const chunked = chunk(pkgInfos, CHUNK_SIZE);
    const timeLabel = `test suite "${suite}"`;
    signale.time(timeLabel);

    const env = printAndGetEnv(suite, options);

    let chunkIndex = -1;
    for (const pkgs of chunked) {
        chunkIndex++;

        if (!pkgs.length) continue;
        if (pkgs.length === 1) {
            writePkgHeader('Running test', pkgs, true);
        } else {
            writeHeader(`Running batch of ${pkgs.length} tests`, true);
        }

        const args = utils.getArgs(options);
        args.projects = pkgs.map((pkgInfo) => path.join('packages', pkgInfo.folderName));

        try {
            await runJest(getRootDir(), args, env, options.jestArgs);
        } catch (err) {
            const names = pkgs.map((pkgInfo) => pkgInfo.name).join(', ');
            if (pkgs.length > 1) {
                errors.push(
                    `At least one of these tests failed ${names} failed, caused by ${err.message}`
                );
            } else {
                errors.push(
                    `Test ${names} failed, caused by ${err.message}`
                );
            }

            await utils.globalTeardown(options, pkgs.map(({ name, dir }) => ({ name, dir })));

            if (options.bail) {
                break;
            }
        } finally {
            if (options.reportCoverage) {
                await utils.reportCoverage(suite, chunkIndex);
            }
        }
    }

    signale.timeEnd(timeLabel);

    cleanup();
    return errors;
}

async function runE2ETest(options: TestOptions): Promise<string[]> {
    let cleanup = () => {};
    const errors: string[] = [];
    const suite = TestSuite.E2E;
    let startedTest = false;

    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }

    try {
        cleanup = await ensureServices(suite, options);
    } catch (err) {
        errors.push(getFullErrorStack(err));
    }

    const rootInfo = getRootInfo();
    const [registry] = rootInfo.terascope.docker.registries;
    const image = `${registry}:e2e`;
    if (!errors.length) {
        try {
            await utils.buildDockerImage(image);
        } catch (err) {
            const error = new TSError(err, {
                message: `Failed to build ${image} docker image`,
            });
            errors.push(getFullErrorStack(error));
        }
    }

    if (!errors.length) {
        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);
        startedTest = true;

        const env = printAndGetEnv(suite, options);

        try {
            await runJest(e2eDir, utils.getArgs(options), env, options.jestArgs);
        } catch (err) {
            errors.push(`Test suite "${suite}" failed, caused by ${err.message}`);
        }

        signale.timeEnd(timeLabel);
    }

    if (startedTest) {
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
        await utils.globalTeardown(options, [{ name: suite, dir: e2eDir }]);
    }

    cleanup();

    return errors;
}

function printAndGetEnv(suite: TestSuite, options: TestOptions) {
    const env = utils.getEnv(options, suite);
    if (options.debug || isCI) {
        const envStr = Object
            .entries(env)
            .map(([key, val]) => `${key}: "${val}"`)
            .join(', ');

        signale.debug(`Setting ${suite} test suite env to ${envStr}`);
    }
    return env;
}
