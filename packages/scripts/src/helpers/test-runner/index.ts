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
    getRootInfo,
    getAvailableTestSuites,
    getDevDockerImage
} from '../misc';
import { ensureServices } from './services';
import { PackageInfo } from '../interfaces';
import { TestOptions } from './interfaces';
import { runJest, dockerPush, dockerTag } from '../scripts';
import * as utils from './utils';
import signale from '../signale';
import { getE2EDir } from '../packages';
import { pullDevDockerImage } from '../publish/utils';

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
        signale.error(`\n${errorMsg}`);

        const exitCode = (process.exitCode || 0) > 0 ? process.exitCode : 1;
        process.exit(exitCode);
        return;
    }

    process.exit(0);
}

async function _runTests(pkgInfos: PackageInfo[], options: TestOptions): Promise<string[]> {
    if (options.suite === 'e2e') {
        return runE2ETest(options);
    }

    const filtered = utils.filterBySuite(pkgInfos, options);
    if (!filtered.length) {
        signale.warn('No tests found.');
        return [];
    }

    const availableSuites = getAvailableTestSuites();
    const grouped = utils.groupBySuite(filtered, availableSuites, options);

    const errors: string[] = [];
    for (const [suite, pkgs] of Object.entries(grouped)) {
        if (!pkgs.length || suite === 'e2e') continue;

        try {
            const suiteErrors: string[] = await runTestSuite(suite, pkgs, options);
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
    suite: string,
    pkgInfos: PackageInfo[],
    options: TestOptions
): Promise<string[]> {
    if (suite === 'e2e') return [];
    const errors: string[] = [];

    // jest or our tests have a memory leak, limiting this seems to help
    const MAX_CHUNK_SIZE = isCI ? 7 : 10;
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

            await utils.globalTeardown(options, pkgs.map((pkg) => ({
                name: pkg.name,
                dir: pkg.dir,
                suite: pkg.terascope.testSuite
            })));

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
    const suite = 'e2e';
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

    if (!errors.length) {
        const rootInfo = getRootInfo();
        const [registry] = rootInfo.terascope.docker.registries;
        const e2eImage = `${registry}:e2e`;

        try {
            const devImage = await pullDevDockerImage();
            await dockerTag(devImage, e2eImage);
        } catch (err) {
            errors.push(getFullErrorStack(err));
        }
    }

    if (!errors.length) {
        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);
        startedTest = true;

        const env = printAndGetEnv(suite, options);

        try {
            await runJest(e2eDir, utils.getArgs(options), env, options.jestArgs, options.debug);
        } catch (err) {
            errors.push(err.message);
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
        await utils.globalTeardown(options, [{
            name: suite,
            dir: e2eDir,
            suite,
        }]);
    }

    if (startedTest && isCI) {
        const devDockerImage = getDevDockerImage();
        try {
            signale.info(`pushing ${devDockerImage}...`);
            await dockerPush(devDockerImage);
        } catch (err) {
            signale.warn(err, `failure to push ${devDockerImage}`);
        }
    }

    cleanup();

    return errors;
}

function printAndGetEnv(suite: string, options: TestOptions) {
    const env = utils.getEnv(options, suite);
    if (options.debug || isCI) {
        const envStr = Object
            .entries(env)
            .filter(([_, val]) => val != null && val !== '')
            .map(([key, val]) => `${key}: "${val}"`)
            .join(', ');

        signale.debug(`Setting ${suite} test suite env to ${envStr}`);
    }
    return env;
}
