import path from 'path';
import fse from 'fs-extra';
import {
    debugLogger,
    get,
    TSError,
    isFunction,
    flatten,
    isCI
} from '@terascope/utils';
import {
    ArgsMap,
    ExecEnv,
    exec,
    fork,
} from '../scripts';
import { TestOptions, GroupedPackages } from './interfaces';
import { PackageInfo, Service } from '../interfaces';
import { getServicesForSuite } from '../misc';
import * as config from '../config';
import signale from '../signale';

const logger = debugLogger('ts-scripts:cmd:test');

export function getArgs(options: TestOptions): ArgsMap {
    const args: ArgsMap = {};
    args.forceExit = '';
    args.coverage = 'true';
    if (config.FORCE_COLOR === '1') {
        args.color = '';
    }

    if (options.bail) {
        args.bail = '';
    }

    if (options.debug || options.trace) {
        args.detectOpenHandles = '';
        args.coverage = 'false';
        args.runInBand = '';
    } else {
        args.silent = '';
        if (config.JEST_MAX_WORKERS != null) {
            args.maxWorkers = String(config.JEST_MAX_WORKERS);
        }
    }

    if (isCI) {
        args.verbose = 'false';
    }

    if (options.watch) {
        args.watch = '';
        args.coverage = 'false';
        args.onlyChanged = '';
        args.notify = '';
    }

    if (options.suite?.includes('e2e')) {
        args.runInBand = '';
        args.coverage = 'false';
        args.bail = '';
    }

    return args;
}

export function getEnv(options: TestOptions, suite?: string): ExecEnv {
    const env: ExecEnv = {
        HOST_IP: config.HOST_IP,
        NODE_ENV: 'test',
        FORCE_COLOR: config.FORCE_COLOR,
        TEST_NAMESPACE: config.TEST_NAMESPACE,
    };

    if (config.DOCKER_NETWORK_NAME) {
        Object.assign(env, {
            DOCKER_NETWORK_NAME: config.DOCKER_NETWORK_NAME
        });
    }

    const launchServices: Service[] = suite ? getServicesForSuite(suite) : [];

    if (launchServices.includes(Service.Elasticsearch)) {
        Object.assign(env, {
            TEST_INDEX_PREFIX: `${config.TEST_NAMESPACE}_`,
            ELASTICSEARCH_HOST: config.ELASTICSEARCH_HOST,
            ELASTICSEARCH_VERSION: options.elasticsearchVersion,
            ELASTICSEARCH_API_VERSION: options.elasticsearchAPIVersion,
        });
    }

    if (launchServices.includes(Service.Minio)) {
        Object.assign(env, {
            MINIO_HOST: config.MINIO_HOST,
            MINIO_VERSION: options.minioVersion,
            MINIO_ACCESS_KEY: config.MINIO_ACCESS_KEY,
            MINIO_SECRET_KEY: config.MINIO_SECRET_KEY,
        });
    }

    if (launchServices.includes(Service.Kafka)) {
        Object.assign(env, {
            KAFKA_BROKER: config.KAFKA_BROKER,
            KAFKA_VERSION: options.kafkaVersion,
        });
    }

    if (launchServices.includes(Service.RabbitMQ)) {
        Object.assign(env, {
            RABBITMQ_HOST: config.RABBITMQ_HOST,
            RABBITMQ_VERSION: options.rabbitmqVersion,
        });
    }

    if (options.keepOpen) {
        env.KEEP_OPEN = 'true';
    }

    if (options.debug || options.trace) {
        let DEBUG = process.env.DEBUG || '';
        const defaultLevel = options.trace ? 'trace' : 'debug';
        const DEBUG_LOG_LEVEL = process.env.DEBUG_LOG_LEVEL || defaultLevel;

        if (!DEBUG.includes('*teraslice*')) {
            if (DEBUG) DEBUG += ',';
            DEBUG += '*teraslice*';
        }

        Object.assign(env, {
            DEBUG,
            DEBUG_LOG_LEVEL
        });
    }

    return env;
}

export function setEnv(options: TestOptions, suite?: string): void {
    const env = getEnv(options, suite);
    for (const [key, value] of Object.entries(env)) {
        process.env[key] = value;
    }
}

export function filterBySuite(pkgInfos: PackageInfo[], options: TestOptions): PackageInfo[] {
    if (!options.suite?.length) return pkgInfos.slice();

    return pkgInfos.filter((pkgInfo) => {
        const suite = pkgInfo.terascope.testSuite;
        if (!suite) {
            throw new Error(`Package ${pkgInfo.name} missing required "terascope.testSuite" configuration`);
        }
        if (options.suite!.includes(suite)) {
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

export function groupBySuite(
    pkgInfos: PackageInfo[],
    availableSuites: string[],
    options: TestOptions
): GroupedPackages {
    const groups: GroupedPackages = {};

    for (const pkgInfo of pkgInfos) {
        const suite = pkgInfo.terascope.testSuite;
        if (!suite || suite === 'disabled') continue;
        if (suite === 'e2e') continue;
        if (!availableSuites.includes(suite)) {
            signale.warn(`${pkgInfo.name} is using ${suite} which is not known, add it to the root package.json`);
        }

        if (!groups[suite]) groups[suite] = [];
        groups[suite].push(pkgInfo);
    }

    const isWatchAll = !options.suite && options.watch;
    const isNotAll = !options.all;

    const bundleSuite = groups[Service.Elasticsearch]
        ? Service.Elasticsearch
        : Object.keys(groups)[0];

    if ((isNotAll || isWatchAll) && bundleSuite && groups[bundleSuite].length) {
        groups[bundleSuite] = flatten(Object.values(groups));
        for (const suite of Object.keys(groups)) {
            if (suite !== bundleSuite) {
                groups[suite] = [];
            }
        }
    }

    return groups;
}

function _getTeardownFile(dir: string): string|undefined {
    let filePath = path.join(dir, 'test/global.teardown.js');
    if (fse.existsSync(filePath)) return filePath;
    filePath = path.join(dir, 'dist/test/global.teardown.js');
    if (fse.existsSync(filePath)) return filePath;
    filePath = path.join(dir, 'dist/global.teardown.js');
    if (fse.existsSync(filePath)) return filePath;
    return undefined;
}

type TeardownPkgsArg = { name: string; dir: string; suite?: string }[];
export async function globalTeardown(options: TestOptions, pkgs: TeardownPkgsArg): Promise<void> {
    for (const { name, dir, suite } of pkgs) {
        const filePath = _getTeardownFile(dir);
        if (filePath) {
            const cwd = process.cwd();
            setEnv(options, suite);
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
                        reason: `Failed to teardown test for "${name}"`,
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
    if (!failed) return;
    if (config.SKIP_E2E_OUTPUT_LOGS) return;

    const errLogs = await getE2ELogs(dir, {
        LOG_LEVEL: 'INFO',
        RAW_LOGS: isCI ? 'true' : 'false',
        FORCE_COLOR: isCI ? '0' : '1',
    });
    process.stderr.write(`${errLogs}\n`);
}

const abc = 'abcdefghijklmnopqrstuvwxyz';

export async function reportCoverage(suite: string, chunkIndex: number): Promise<void> {
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
