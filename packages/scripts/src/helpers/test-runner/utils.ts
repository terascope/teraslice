import isCI from 'is-ci';
import { PackageInfo } from '../interfaces';
import { mapToArgs } from '../scripts';
import { TestOptions } from './interfaces';

export function getArgs(options: TestOptions): string[] {
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

    if (options.filter) {
        args['testPathPattern'] = options.filter;
    }

    return mapToArgs(args);
}

export function getEnv(options: TestOptions): { [name: string]: string } {
    if (!options.debug && !process.env.DEBUG) return {};

    return {
        DEBUG: '*teraslice*',
    };
}

export function filterBySuite(pkgInfos: PackageInfo[], options: TestOptions): PackageInfo[] {
    if (!options.suite) return pkgInfos.slice();

    return pkgInfos.filter(pkgInfo => {
        const suite = pkgInfo.terascope.testSuite;
        if (!suite) {
            throw new Error(`Package ${pkgInfo.name} missing required "terascope.testSuite" configuration`);
        }
        if (suite === options.suite) return true;
        if (!options.all) {
            console.error(`* skipping ${suite} test`);
        }
        return false;
    });
}
