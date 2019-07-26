import isCI from 'is-ci';
import { PackageInfo, TestSuite } from '../interfaces';
import { mapToArgs } from '../scripts';
import { TestOptions, GroupedPackages } from './interfaces';
import debug from './debug';

export function getArgs(options: TestOptions): string[] {
    const args: { [key: string]: string } = {};
    args['forceExit'] = '';

    if (isCI) {
        args['silent'] = '';
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
        } else {
            debug(`* skipping ${suite} test`);
        }
        return false;
    });
}

export function groupBySuite(pkgInfos: PackageInfo[]): GroupedPackages {
    const groups: GroupedPackages = {
        [TestSuite.Unit]: [],
        [TestSuite.Elasticsearch]: [],
        [TestSuite.Kafka]: [],
        [TestSuite.E2E]: [],
    };

    for (const pkgInfo of pkgInfos) {
        const suite = pkgInfo.terascope.testSuite || TestSuite.Disabled;
        if (suite === TestSuite.Disabled) continue;
        groups[suite].push(pkgInfo);
    }

    return groups;
}
