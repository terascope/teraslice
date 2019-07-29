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

    const grouped = groupBySuite(filtered);

    const errors: string[] = [];
    let ranOnce = false;

    for (const [suite, pkgs] of Object.entries(grouped)) {
        if (!pkgs.length) continue;

        writeHeader(`running test suite for ${suite}`, ranOnce);

        try {
            let suiteErrors: string[];
            if (!options.debug) {
                suiteErrors = await runTestSuiteInParallel(suite as TestSuite, pkgs, options);
            } else {
                suiteErrors = await runTestSuiteSerial(suite as TestSuite, pkgs, options);
            }

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

async function runTestSuiteSerial(suite: TestSuite, pkgInfos: PackageInfo[], options: TestOptions): Promise<string[]> {
    await ensureServices(suite, options);

    const errors: string[] = [];

    for (const pkgInfo of pkgInfos) {
        writePkgHeader('running test', [pkgInfo], true);
        try {
            await runJest(pkgInfo.dir, getArgs(options), getEnv(options));
        } catch (err) {
            console.error(err);
            errors.push(`Test ${pkgInfo.name} Failed`);

            if (options.bail) {
                break;
            }
        }
    }

    return errors;
}

async function runTestSuiteInParallel(suite: TestSuite, pkgInfos: PackageInfo[], options: TestOptions): Promise<string[]> {
    await ensureServices(suite, options);

    const errors: string[] = [];

    const chunked = chunk(pkgInfos, 3);

    for (const pkgs of chunked) {
        writePkgHeader('running tests', pkgs, true);

        const args = getArgs(options);
        args.projects = pkgs.map(pkgInfo => path.join('packages', pkgInfo.folderName));

        try {
            await runJest(getRootDir(), args, getEnv(options));
        } catch (err) {
            console.error(err);
            errors.push(`Test(s) ${pkgs.map(pkgInfo => pkgInfo.name)} Failed`);
            if (options.bail) {
                break;
            }
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

export function chunk<T>(dataArray: T[], size: number) {
    if (size < 1) return [dataArray];
    const results: T[][] = [];
    let chunked: T[] = [];

    for (let i = 0; i < dataArray.length; i += 1) {
        chunked.push(dataArray[i]);
        if (chunked.length === size) {
            results.push(chunked);
            chunked = [];
        }
    }

    if (chunked.length > 0) results.push(chunked);
    return results;
}
