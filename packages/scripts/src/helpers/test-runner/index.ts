import { writePkgHeader, formatList, cliError } from '../misc';
import { getArgs, filterBySuite, getEnv } from './utils';
import { PackageInfo } from '../interfaces';
import { TestOptions } from './interfaces';
import { runJest } from '../scripts';

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    const errors: string[] = [];

    let runOnce = false;
    for (const pkgInfo of filterBySuite(pkgInfos, options)) {
        writePkgHeader('running test', [pkgInfo], runOnce);

        try {
            await runJest(pkgInfo, getArgs(options), getEnv(options));
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
