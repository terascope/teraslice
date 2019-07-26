import path from 'path';
import { writePkgHeader, writeHeader, formatList, cliError, getRootDir } from '../misc';
import { getArgs, filterBySuite, getEnv, groupBySuite, buildDockerImage } from './utils';
import { PackageInfo, TestSuite } from '../interfaces';
import { ensureServices } from './services';
import { TestOptions } from './interfaces';
import { runJest } from '../scripts';
import debug from './debug';

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    debug('running tests with options', options);

    if (options.suite === TestSuite.E2E) {
        return runE2ETest(options);
    }

    const filtered = filterBySuite(pkgInfos, options);
    if (!filtered.length) {
        console.error('No tests found.');
        return;
    }

    const grouped = groupBySuite(pkgInfos);

    const errors: string[] = [];
    let ranOnce = false;

    for (const [suite, pkgs] of Object.entries(grouped)) {
        writeHeader(`running test suite for ${suite}`, ranOnce);

        try {
            const suiteErrors = await runTestSuite(suite as TestSuite, pkgs, options);
            if (suiteErrors.length) {
                errors.push(`Test Suite ${suite} Failed`, ...suiteErrors);
                if (options.bail) {
                    break;
                }
            }
        } catch (err) {
            console.error(err);
            break;
        } finally {
            ranOnce = true;
        }
    }

    if (errors.length > 1) {
        cliError('Error', `Multiple Test Failures:${formatList(errors)}`);
    } else if (errors.length === 1) {
        cliError('Error', errors[0]);
    }
}

/**
 * @todo run multiple at once
 */
async function runTestSuite(suite: TestSuite, pkgInfos: PackageInfo[], options: TestOptions): Promise<string[]> {
    await ensureServices(suite, options);

    const errors: string[] = [];

    let ranOnce = false;
    for (const pkgInfo of pkgInfos) {
        writePkgHeader('running test', [pkgInfo], ranOnce);

        try {
            await runJest(pkgInfo.dir, getArgs(options), getEnv(options));
        } catch (err) {
            console.error(err);
            errors.push(`Test ${pkgInfo.name} Failed`);

            if (options.bail) {
                break;
            }
        } finally {
            ranOnce = true;
        }
    }

    return errors;
}

async function runE2ETest(options: TestOptions): Promise<void> {
    await ensureServices(TestSuite.E2E, options);
    await buildDockerImage('e2e_teraslice');

    const e2eDir = path.join(getRootDir(), 'e2e');
    try {
        await runJest(e2eDir, getArgs(options), getEnv(options));
    } catch (err) {
        console.error(err);
        cliError('Error', 'Test e2e Failed');
    }
    return;
}
