import path from 'path';
import isCI from 'is-ci';
import { debugLogger, chunk, TSError, getFullErrorStack } from '@terascope/utils';
import { writePkgHeader, writeHeader, formatList, getRootDir } from '../misc';
import { ensureServices, stopAllServices } from './services';
import { PackageInfo, TestSuite } from '../interfaces';
import { TestOptions } from './interfaces';
import { runJest } from '../scripts';
import * as utils from './utils';
import signale from '../signale';

const logger = debugLogger('ts-scripts:cmd:test');

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    logger.info('running tests with options', options);
    let errors: string[];

    try {
        errors = await _runTests(pkgInfos, options);
    } catch (err) {
        errors = [getFullErrorStack(err)];
    }

    await cleanUpIfNeeded(pkgInfos, options);

    let errorMsg: string = '';
    if (errors.length > 1) {
        errorMsg = `Multiple Test Failures:${formatList(errors)}`;
    } else if (errors.length === 1) {
        errorMsg = errors[0];
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

async function cleanUpIfNeeded(pkgInfos: PackageInfo[], options: TestOptions) {
    if (options.suite === TestSuite.E2E || !utils.onlyUnitTests(pkgInfos)) {
        try {
            await stopAllServices();
        } catch (err) {
            signale.error(new TSError(err, { reason: 'Failure stopping services' }));
        }
    }
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

    const grouped = utils.groupBySuite(filtered);

    const errors: string[] = [];
    let ranOnce = false;

    for (const [suite, pkgs] of Object.entries(grouped)) {
        if (!pkgs.length) continue;

        writeHeader(`Running test suite "${suite}"`, ranOnce);

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
        } finally {
            ranOnce = true;
        }
    }

    return errors;
}

async function runTestSuite(suite: TestSuite, pkgInfos: PackageInfo[], options: TestOptions): Promise<string[]> {
    let cleanup = () => {};
    const errors: string[] = [];

    try {
        cleanup = await ensureServices(suite, options);
    } catch (err) {
        errors.push(getFullErrorStack(err));
    }

    if (!errors.length) {
        // unit tests don't have as much as a memory leak so we can run more at a time
        // elasticsearch we should limit the number packages at time
        const chunkSize = suite === TestSuite.Unit ? 9 : 3;
        const chunked = chunk(pkgInfos, options.debug ? 1 : chunkSize);
        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);

        const env = utils.getEnv(options);
        if (options.debug || isCI) {
            signale.debug(`setting env for test suite "${suite}"`, env);
        }

        for (const pkgs of chunked) {
            if (!pkgs.length) continue;
            if (pkgs.length === 1) {
                writePkgHeader('Running test', pkgs, true);
            } else {
                writeHeader(`Running batch of ${pkgs.length} tests`, true);
            }

            const args = utils.getArgs(options);
            args.projects = pkgs.map(pkgInfo => path.join('packages', pkgInfo.folderName));

            try {
                await runJest(getRootDir(), args, env, options.jestArgs);
            } catch (err) {
                if (pkgs.length > 1) {
                    const error = new TSError(err, {
                        message: `At least one of these tests failed ${pkgs.map(pkgInfo => pkgInfo.name).join(', ')} failed`,
                    });
                    errors.push(getFullErrorStack(error));
                } else {
                    const error = new TSError(err, {
                        message: `Test ${pkgs.map(pkgInfo => pkgInfo.name).join(', ')} failed`,
                    });
                    errors.push(getFullErrorStack(error));
                }

                await utils.globalTeardown(options, pkgs.map(({ name, dir }) => ({ name, dir })));

                if (options.bail) {
                    break;
                }
            }
        }

        signale.timeEnd(timeLabel);
    }

    cleanup();
    return errors;
}

async function runE2ETest(options: TestOptions): Promise<string[]> {
    let cleanup = () => {};
    const errors: string[] = [];
    const e2eDir = path.join(getRootDir(), 'e2e');
    const suite = TestSuite.E2E;
    let startedTest = false;

    try {
        cleanup = await ensureServices(suite, options);
    } catch (err) {
        errors.push(getFullErrorStack(err));
    }

    const image = 'ts_test_teraslice';
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

        const env = utils.getEnv(options);
        if (options.debug || isCI) {
            signale.debug(`setting env for test suite "${suite}"`, env);
        }

        try {
            await runJest(e2eDir, utils.getArgs(options), env, options.jestArgs);
        } catch (err) {
            const error = new TSError(err, {
                message: `Test suite "${suite}" failed`,
            });
            errors.push(getFullErrorStack(error));
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
