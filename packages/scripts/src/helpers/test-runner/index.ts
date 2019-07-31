import path from 'path';
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
    } finally {
        if (options.suite === TestSuite.E2E || !utils.onlyUnitTests(pkgInfos)) {
            await stopAllServices().catch(err => {
                signale.error(new TSError(err, { reason: 'Failure stopping services' }));
            });
        }
    }

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
        const chunked = chunk(pkgInfos, options.debug ? 1 : 5);
        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);

        for (const pkgs of chunked) {
            if (pkgs.length > 1) {
                writePkgHeader('Running batch of tests', pkgs, true);
            } else {
                writePkgHeader('Running test', pkgs, true);
            }

            const args = utils.getArgs(options);
            args.projects = pkgs.map(pkgInfo => path.join('packages', pkgInfo.folderName));

            try {
                await runJest(getRootDir(), args, utils.getEnv(options), options.jestArgs);
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

        try {
            await runJest(e2eDir, utils.getArgs(options), utils.getEnv(options), options.jestArgs);
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
