import ms from 'ms';
import path from 'path';
import isCI from 'is-ci';
import fse from 'fs-extra';
import {
    debugLogger, get, TSError, isFunction
} from '@terascope/utils';
import {
    ArgsMap, ExecEnv, exec, fork, dockerPull, dockerBuild
} from '../scripts';
import { TestOptions, GroupedPackages } from './interfaces';
import { PackageInfo, TestSuite } from '../interfaces';
import { getRootInfo } from '../misc';
import { HOST_IP } from '../config';
import signale from '../signale';

const logger = debugLogger('ts-scripts:cmd:test');

export function getArgs(options: TestOptions): ArgsMap {
    const args: ArgsMap = {};
    args.forceExit = '';
    args.passWithNoTests = '';
    args.coverage = 'true';
    args.color = '';

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

    if (options.watch) {
        args.watch = '';
        args.coverage = 'false';
        args.onlyChanged = '';
        args.notify = '';
    }

    if (options.suite === TestSuite.E2E) {
        args.runInBand = '';
        args.coverage = 'false';
        args.bail = '';
    }

    return args;
}

export function getEnv(options: TestOptions, suite?: TestSuite): ExecEnv {
    const env: ExecEnv = {
        HOST_IP,
        NODE_ENV: 'test',
        FORCE_COLOR: '1',
    };

    const isE2E = suite === TestSuite.E2E;

    if (!suite || suite === TestSuite.Elasticsearch || isE2E) {
        Object.assign(env, {
            TEST_INDEX_PREFIX: 'teratest_',
            ELASTICSEARCH_HOST: options.elasticsearchHost,
            ELASTICSEARCH_VERSION: options.elasticsearchVersion,
            ELASTICSEARCH_API_VERSION: options.elasticsearchAPIVersion,
        });
    }

    if (!suite || suite === TestSuite.Kafka || isE2E) {
        Object.assign(env, {
            KAFKA_BROKER: options.kafkaBroker,
            KAFKA_VERSION: options.kafkaVersion,
        });
    }

    if (options.debug) {
        let DEBUG = process.env.DEBUG || '';
        if (!DEBUG.includes('*teraslice*')) {
            if (DEBUG) DEBUG += ',';
            DEBUG += '*teraslice*';
        }
        Object.assign(env, { DEBUG });
    }

    return env;
}

export function setEnv(options: TestOptions) {
    const env = getEnv(options);
    for (const [key, value] of Object.entries(env)) {
        process.env[key] = value;
    }
}

export function filterBySuite(pkgInfos: PackageInfo[], options: TestOptions): PackageInfo[] {
    if (!options.suite) return pkgInfos.slice();

    return pkgInfos.filter((pkgInfo) => {
        const suite = pkgInfo.terascope.testSuite;
        if (!suite) {
            throw new Error(`Package ${pkgInfo.name} missing required "terascope.testSuite" configuration`);
        }
        if (suite === options.suite) {
            logger.info(`* found ${pkgInfo.name} for suite ${suite} to test`);
            return true;
        }
        const msg = `* skipping ${pkgInfo.name} ${suite} test`;
        if (!options.all) {
            signale.warn(msg);
        } else {
            logger.debug(msg);
        }
        return false;
    });
}

export function onlyUnitTests(pkgInfos: PackageInfo[]): boolean {
    return pkgInfos.every((pkgInfo) => pkgInfo.terascope.testSuite === TestSuite.Unit);
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

export async function globalTeardown(options: TestOptions, pkgs: { name: string; dir: string }[]) {
    for (const { name, dir } of pkgs) {
        const filePath = path.join(dir, 'test/global.teardown.js');
        if (fse.existsSync(filePath)) {
            const cwd = process.cwd();
            setEnv(options);
            signale.debug(`Running ${path.relative(process.cwd(), filePath)}`);
            process.chdir(dir);

            try {
                const teardownFn = require(filePath);
                if (isFunction(teardownFn)) {
                    await teardownFn();
                }
            } catch (err) {
                signale.error(
                    new TSError(err, {
                        message: `Failed to teardown test for "${name}"`,
                    })
                );
            } finally {
                process.chdir(cwd);
            }
        }
    }
}

async function getE2ELogs(dir: string, env: ExecEnv): Promise<string> {
    const pkgJSON = await fse.readJSON(path.join(dir, 'package.json'));
    const hasLogsScript = Boolean(get(pkgJSON, 'scripts.logs'));
    if (hasLogsScript) {
        const result = await exec(
            {
                cmd: 'yarn',
                args: ['run', 'logs', '-n', '2000'],
                cwd: dir,
                env,
            },
            false
        );
        return result || '';
    }
    return '';
}

export async function logE2E(dir: string, failed: boolean): Promise<void> {
    if (failed) {
        const errLogs = await getE2ELogs(dir, {
            LOG_LEVEL: 'WARN',
            RAW_LOGS: 'false',
            FORCE_COLOR: '1',
        });
        process.stderr.write(`${errLogs}\n`);
    }
}

const abc = 'abcdefghijklmnopqrstuvwxyz';

export async function reportCoverage(suite: TestSuite, chunkIndex: number) {
    const id = abc[chunkIndex] || 'any';

    signale.info('* reporting coverage');
    try {
        await fork({
            cmd: 'codecov',
            args: ['--clear', '--flags', `${suite}-${id}`],
        });
    } catch (err) {
        signale.error(err);
    }
}

function getCacheFrom(): string[] {
    if (!isCI) return [];

    const rootInfo = getRootInfo();
    const layers = rootInfo.docker.cache_layers || [];
    if (!layers.length) return [];
    const cacheFrom: { [name: string]: string } = {};
    layers.forEach(({ from, name }) => {
        if (cacheFrom[from] == null) {
            cacheFrom[from] = from;
        }
        cacheFrom[name] = `${rootInfo.docker.image}:dev-${name}`;
    });
    return Object.values(cacheFrom);
}

export async function buildDockerImage(target: string): Promise<void> {
    const startTime = Date.now();
    signale.pending(`building docker image ${target}`);

    const cacheFrom = getCacheFrom();
    if (cacheFrom.length) {
        signale.debug(`pulling images ${cacheFrom}`);
        await Promise.all(cacheFrom.map(dockerPull));
    }

    await dockerBuild(target, cacheFrom);
    signale.success(`built docker image ${target}, took ${ms(Date.now() - startTime)}`);
}
