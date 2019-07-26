import isCI from 'is-ci';
import { PackageInfo, TestSuite } from '../interfaces';
import { mapToArgs, ExecEnv, dockerBuild, dockerPull } from '../scripts';
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

    if (options.suite === TestSuite.E2E) {
        args['runInBand'] = '';
    }

    return mapToArgs(args);
}

export function getEnv(options: TestOptions): ExecEnv {
    const defaults: ExecEnv = {
        ELASTICSEARCH_URL: options.elasticsearchUrl,
        KAFKA_BROKERS: options.kafkaBrokers.join(','),
    };

    if (!options.debug && !process.env.DEBUG) return defaults;

    return {
        ...defaults,
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

export async function buildDockerImage(target: string): Promise<void> {
    const cacheFrom = isCI ? ['node:10.16.0-alpine', 'terascope/teraslice:dev-base', 'terascope/teraslice:dev-connectors'] : [];
    await Promise.all(cacheFrom.map(dockerPull));
    await dockerBuild(target, cacheFrom);
}
