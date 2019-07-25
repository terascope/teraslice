import path from 'path';
import { writePkgHeader, formatList, cliError, getRootDir } from '../misc';
import { getArgs, filterBySuite, getEnv } from './utils';
import { PackageInfo, TestSuite } from '../interfaces';
import { TestOptions } from './interfaces';
import { runJest } from '../scripts';

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    if (options.suite === TestSuite.E2E) {
        const e2eDir = path.join(getRootDir(), 'e2e');
        try {
            await runJest(e2eDir, getArgs(options), getEnv(options));
        } catch (err) {
            cliError('Error', 'Test e2e Failed');
        }
        return;
    }

    const filtered = filterBySuite(pkgInfos, options);
    if (!filtered.length) {
        console.error('No tests found.');
        process.exit(0);
    }

    const errors: string[] = [];
    let runOnce = false;

    for (const pkgInfo of filtered) {
        writePkgHeader('running test', [pkgInfo], runOnce);

        try {
            await runJest(pkgInfo.dir, getArgs(options), getEnv(options));
        } catch (err) {
            console.error(err);
            errors.push(`Test ${pkgInfo.name} Failed`);

            if (options.bail) {
                break;
            }
        } finally {
            runOnce = true;
        }
    }

    if (errors.length > 1) {
        cliError('Error', `Multiple Test Failures:${formatList(errors)}`);
    } else if (errors.length === 1) {
        cliError('Error', errors[0]);
    }
}
