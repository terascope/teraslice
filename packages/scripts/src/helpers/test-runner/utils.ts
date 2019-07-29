import isCI from 'is-ci';
import { PackageInfo, TestSuite } from '../interfaces';
import { ArgsMap, ExecEnv, dockerBuild, dockerPull } from '../scripts';
import { TestOptions, GroupedPackages } from './interfaces';
import debug from './debug';

export function getArgs(options: TestOptions): ArgsMap {
    const args: ArgsMap = {};
    args.forceExit = '';
    args.passWithNoTests = '';
    args.coverage = 'true';

    if (options.bail) {
        args.bail = '';
    }

    if (options.debug) {
        args.detectOpenHandles = '';
        args.coverage = 'false';
        args.runInBand = '';
    } else {
        args.silent = '';
    }

    if (options.filter) {
        args.testPathPattern = options.filter;
    }

    if (options.suite === TestSuite.E2E) {
        args.runInBand = '';
        args.coverage = 'false';
    }

    return args;
}

export function getEnv(options: TestOptions): ExecEnv {
    const defaults: ExecEnv = {
        ELASTICSEARCH_URL: options.elasticsearchUrl,
        KAFKA_BROKERS: options.kafkaBrokers.join(','),
    };

    if (!options.debug) return defaults;

    return {
        ...defaults,
        DEBUG: `${process.env.DEBUG},*teraslice*`,
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
        const msg = `* skipping ${pkgInfo.name} ${suite} test`;
        if (!options.all) {
            console.error(msg);
        } else {
            debug(msg);
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
    if (cacheFrom.length) {
        console.error(`* pulling images ${cacheFrom}`);
        await Promise.all(cacheFrom.map(dockerPull));
    }

    console.error(`* building docker image ${target}`);
    await dockerBuild(target, cacheFrom);
}
