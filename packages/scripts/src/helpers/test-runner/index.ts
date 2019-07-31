import path from 'path';
import { debugLogger, chunk, TSError, getFullErrorStack } from '@terascope/utils';
import { writePkgHeader, writeHeader, formatList, cliError, getRootDir } from '../misc';
import * as utils from './utils';
import { ensureServices, stopAllServices } from './services';
import { PackageInfo, TestSuite } from '../interfaces';
import { runJest } from '../scripts';
import { TestOptions } from './interfaces';
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
        if (!utils.onlyUnitTests(pkgInfos)) {
            await stopAllServices().catch(err => {
                signale.error(new TSError(err, { reason: 'Failure stopping services' }));
            });
        }
    }

    if (errors.length > 1) {
        cliError('\n\n', `Multiple Test Failures:${formatList(errors)}`);
    } else if (errors.length === 1) {
        cliError('\n\n', errors[0]);
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

        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);
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
            signale.timeEnd(timeLabel);
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
        const error = new TSError(err, {
            message: `Failed to start services for "${suite}"`,
        });
        errors.push(getFullErrorStack(error));
    }

    if (!errors.length) {
        const chunked = chunk(pkgInfos, options.debug ? 1 : 5);

        for (const pkgs of chunked) {
            writePkgHeader('Running tests', pkgs, true);

            const args = utils.getArgs(options);
            args.projects = pkgs.map(pkgInfo => path.join('packages', pkgInfo.folderName));

            try {
                await runJest(getRootDir(), args, utils.getEnv(options), options.jestArgs);
            } catch (err) {
                const error = new TSError(err, {
                    message: `Test(s) ${pkgs.map(pkgInfo => pkgInfo.name)} Failed`,
                });
                errors.push(getFullErrorStack(error));

                await utils.globalTeardown(pkgs.map(({ name, dir }) => ({ name, dir })));
                if (options.bail) {
                    break;
                }
            }
        }
    }

    try {
        cleanup();
    } catch (err) {
        signale.error(
            new TSError(err, {
                message: `Failed to cleanup after "${suite}" test suite`,
            })
        );
    }
    return errors;
}

async function runE2ETest(options: TestOptions): Promise<string[]> {
    let cleanup = () => {};
    const errors: string[] = [];
    const e2eDir = path.join(getRootDir(), 'e2e');
    const suite = TestSuite.E2E;

    try {
        cleanup = await ensureServices(suite, options);
    } catch (err) {
        const error = new TSError(err, {
            message: `Failed to start services for ${suite}`,
        });
        errors.push(getFullErrorStack(error));
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

        try {
            await runJest(e2eDir, utils.getArgs(options), utils.getEnv(options), options.jestArgs);
        } catch (err) {
            const error = new TSError(err, {
                message: `Test suite "${suite}" Failed`,
            });
            errors.push(getFullErrorStack(error));

            await utils.globalTeardown([{ name: suite, dir: e2eDir }]);
        }

        signale.timeEnd(timeLabel);
    }

    try {
        await utils.logE2E(e2eDir, errors.length > 0);
    } catch (err) {
        signale.error(
            new TSError(err, {
                reason: `Writing the "${suite}" logs failed`,
            })
        );
    }

    try {
        cleanup();
    } catch (err) {
        signale.error(
            new TSError(err, {
                reason: `Failed to cleanup after "${suite}" test suite`,
            })
        );
    }

    return errors;
}
