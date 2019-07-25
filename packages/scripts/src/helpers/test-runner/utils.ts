import isCI from 'is-ci';
import { PackageInfo, TestSuite } from '../interfaces';
import { TestOptions } from './interfaces';
import { writePkgHeader } from '../misc';
import { mapToArgs, runJest } from '../scripts';

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    for (const pkgInfo of pkgInfos) {
        if (isDisabled(pkgInfo)) {
            writePkgHeader('skipping disabled test', [pkgInfo]);
            continue;
        }
        writePkgHeader('running test', [pkgInfo]);
        await runJest(pkgInfo, getArgs(options));
    }
}

function isDisabled(pkgInfo: PackageInfo): boolean {
    if (!pkgInfo.terascope.testSuite) {
        throw new Error(`Package ${pkgInfo.name} missing required "terascope.testSuite" configuration`);
    }

    if (pkgInfo.terascope.testSuite === TestSuite.Disabled) return true;
    return false;
}

function getArgs(options: TestOptions): string[] {
    const args: { [key: string]: string } = {};
    args['forceExit'] = '';

    if (isCI) {
        args['silient'] = '';
    }

    if (options.bail) {
        args['bail'] = '';
    }

    if (options.debug) {
        args['detectOpenHandles'] = '';
        args['coverage'] = 'false';
        args['runInBand'] = '';
    }

    return mapToArgs(args);
}
