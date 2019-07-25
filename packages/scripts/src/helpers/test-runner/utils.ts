import isCI from 'is-ci';
import { PackageInfo } from '../interfaces';
import { TestOptions } from './interfaces';
import { writePkgHeader } from '../misc';
import { mapToArgs, runJest } from '../scripts';

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    for (const pkgInfo of pkgInfos) {
        writePkgHeader('running test', [pkgInfo]);
        await runJest(pkgInfo, getArgs(options));
    }
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
