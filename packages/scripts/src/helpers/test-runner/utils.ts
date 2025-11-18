import path from 'node:path';
import fse from 'fs-extra';
import {
    debugLogger, get, flatten,
    isCI, toString
} from '@terascope/core-utils';
import {
    ArgsMap, ExecEnv, exec
} from '../scripts.js';
import { TestOptions, GroupedPackages } from './interfaces.js';
import { PackageInfo, Service } from '../interfaces.js';
import { getServicesForSuite } from '../misc.js';
import config from '../config.js';
import signale from '../signale.js';
import type {
    TestEnv,
    ElasticsearchTestEnv,
    KafkaTestEnv,
    MinioTestEnv,
    OpenSearchTestEnv,
    RabbitMQTestEnv
} from '@terascope/types';

const logger = debugLogger('ts-scripts:cmd:test');

export function getArgs(options: TestOptions): ArgsMap {
    const args: ArgsMap = {};
    args.forceExit = '';
    args.coverage = toString(options.reportCoverage);

    if (config.FORCE_COLOR === '1') {
        args.color = '';
    }

    if (options.bail) {
        args.bail = '';
    }

    if (options.debug || options.trace) {
        args.detectOpenHandles = options.trace ? 'true' : 'false';
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

export function getEnv(options: TestOptions, suite: string): TestEnv {
    const env: TestEnv = {
        HOST_IP: config.HOST_IP,
        NODE_ENV: 'test' as const,
        FORCE_COLOR: config.FORCE_COLOR,
        TEST_NAMESPACE: config.TEST_NAMESPACE,
        TZ: 'utc',
        NODE_VERSION: config.NODE_VERSION,
        KIND_CLUSTER: options.kindClusterName,
        TERASLICE_PORT: config.TERASLICE_PORT,
        TJM_TEST_MODE: (suite !== 'e2e' ? 'true' : 'false') as 'true' | 'false',
        NODE_OPTIONS: '--experimental-vm-modules',
        USE_HELMFILE: (options.useHelmfile ? 'true' : 'false') as 'true' | 'false',
        TEST_PLATFORM: options.clusteringType,
        FILE_LOGGING: (options.logs ? 'true' : 'false') as 'true' | 'false',
        CERT_PATH: config.CERT_PATH
    } satisfies NodeJS.ProcessEnv;

    if (config.DOCKER_NETWORK_NAME) {
        Object.assign(env, {
            DOCKER_NETWORK_NAME: config.DOCKER_NETWORK_NAME
        } satisfies NodeJS.ProcessEnv);
    }

    const launchServices: Service[] = suite ? getServicesForSuite(suite) : [];

    if (launchServices.includes(Service.Elasticsearch)) {
        Object.assign(env, {
            TEST_INDEX_PREFIX: `${config.TEST_NAMESPACE}_`,
            ELASTICSEARCH_HOST: config.ELASTICSEARCH_HOST,
            ELASTICSEARCH_VERSION: config.ELASTICSEARCH_VERSION,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`
        } satisfies ElasticsearchTestEnv);
    }

    if (launchServices.includes(Service.RestrainedElasticsearch)) {
        Object.assign(env, {
            ELASTICSEARCH_HOST: config.RESTRAINED_ELASTICSEARCH_HOST,
            ELASTICSEARCH_VERSION: config.ELASTICSEARCH_VERSION,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`,
            TEST_INDEX_PREFIX: `${config.TEST_NAMESPACE}_`,
        } satisfies ElasticsearchTestEnv);
    }

    if (launchServices.includes(Service.Minio)) {
        Object.assign(env, {
            MINIO_ACCESS_KEY: config.MINIO_ACCESS_KEY,
            MINIO_HOST: config.MINIO_HOST,
            MINIO_SECRET_KEY: config.MINIO_SECRET_KEY,
            MINIO_VERSION: config.MINIO_VERSION,
        } satisfies MinioTestEnv);
    }

    if (launchServices.includes(Service.Kafka)) {
        Object.assign(env, {
            KAFKA_BROKER: config.KAFKA_BROKER,
            KAFKA_PORT: config.KAFKA_PORT,
            KAFKA_VERSION: config.KAFKA_VERSION,
        } satisfies KafkaTestEnv);
    }

    if (launchServices.includes(Service.RabbitMQ)) {
        Object.assign(env, {
            RABBITMQ_HOSTNAME: config.RABBITMQ_HOSTNAME,
            RABBITMQ_MANAGEMENT_PORT: `${config.RABBITMQ_MANAGEMENT_PORT}`,
            RABBITMQ_PASSWORD: config.RABBITMQ_PASSWORD,
            RABBITMQ_PORT: `${config.RABBITMQ_PORT}`,
            RABBITMQ_USER: config.RABBITMQ_USER,
            RABBITMQ_VERSION: config.RABBITMQ_VERSION,
        } satisfies RabbitMQTestEnv);
    }

    if (launchServices.includes(Service.Opensearch)) {
        Object.assign(env, {
            DISABLE_INSTALL_DEMO_CONFIG: 'true',
            DISABLE_SECURITY_PLUGIN: 'true',
            OPENSEARCH_HOST: config.OPENSEARCH_HOST,
            OPENSEARCH_HOSTNAME: config.OPENSEARCH_HOSTNAME,
            OPENSEARCH_PASSWORD: config.OPENSEARCH_PASSWORD,
            OPENSEARCH_PORT: config.OPENSEARCH_PORT,
            OPENSEARCH_SSL_HOST: config.OPENSEARCH_SSL_HOST,
            OPENSEARCH_USER: config.OPENSEARCH_USER,
            OPENSEARCH_VERSION: config.OPENSEARCH_VERSION,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`,
            TEST_INDEX_PREFIX: `${config.TEST_NAMESPACE}_`
        } satisfies OpenSearchTestEnv);
    }

    if (launchServices.includes(Service.RestrainedOpensearch)) {
        Object.assign(env, {
            DISABLE_INSTALL_DEMO_CONFIG: 'true',
            DISABLE_SECURITY_PLUGIN: 'true',
            OPENSEARCH_HOSTNAME: config.OPENSEARCH_HOSTNAME,
            OPENSEARCH_PASSWORD: config.OPENSEARCH_PASSWORD,
            OPENSEARCH_PORT: config.OPENSEARCH_PORT,
            OPENSEARCH_SSL_HOST: config.OPENSEARCH_SSL_HOST,
            OPENSEARCH_USER: config.OPENSEARCH_USER,
            OPENSEARCH_VERSION: config.OPENSEARCH_VERSION,
            RESTRAINED_OPENSEARCH_HOST: config.RESTRAINED_OPENSEARCH_HOST,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`,
            TEST_INDEX_PREFIX: `${config.TEST_NAMESPACE}_`
        } satisfies OpenSearchTestEnv);
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
        } satisfies NodeJS.ProcessEnv);
    }

    return env;
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
        LOG_LEVEL: 'info',
        RAW_LOGS: isCI ? 'true' : 'false',
        FORCE_COLOR: isCI ? '0' : '1',
    });
    process.stderr.write(`${errLogs}\n`);
}
