import path from 'node:path';
import { execa } from 'execa';
import fse from 'fs-extra';
import {
    debugLogger, get, flatten,
    isCI, toString, TSError
} from '@terascope/utils';
import {
    ArgsMap, ExecEnv, exec,
    fork,
} from '../scripts.js';
import { TestOptions, GroupedPackages } from './interfaces.js';
import { PackageInfo, Service } from '../interfaces.js';
import { getServicesForSuite } from '../misc.js';
import * as config from '../config.js';
import signale from '../signale.js';
import { getE2EDir } from '../packages.js';
import type { K8s } from '../k8s-env/k8s.js';

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

export function getEnv(options: TestOptions, suite: string): ExecEnv {
    const env: ExecEnv = {
        HOST_IP: config.HOST_IP,
        NODE_ENV: 'test',
        FORCE_COLOR: config.FORCE_COLOR,
        TEST_NAMESPACE: config.TEST_NAMESPACE,
        TZ: 'utc',
        NODE_VERSION: config.NODE_VERSION,
        KIND_CLUSTER: options.kindClusterName,
        TERASLICE_PORT: config.TERASLICE_PORT,
        TJM_TEST_MODE: suite !== 'e2e' ? 'true' : 'false',
        NODE_OPTIONS: '--experimental-vm-modules',
        USE_HELMFILE: options.useHelmfile ? 'true' : 'false'
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
            ELASTICSEARCH_VERSION: config.ELASTICSEARCH_VERSION,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`
        });
    }

    if (launchServices.includes(Service.RestrainedElasticsearch)) {
        Object.assign(env, {
            TEST_INDEX_PREFIX: `${config.TEST_NAMESPACE}_`,
            ELASTICSEARCH_HOST: config.RESTRAINED_ELASTICSEARCH_HOST,
            ELASTICSEARCH_VERSION: config.ELASTICSEARCH_VERSION,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`
        });
    }

    if (launchServices.includes(Service.Minio)) {
        Object.assign(env, {
            MINIO_HOST: config.MINIO_HOST,
            MINIO_VERSION: config.MINIO_VERSION,
            MINIO_ACCESS_KEY: config.MINIO_ACCESS_KEY,
            MINIO_SECRET_KEY: config.MINIO_SECRET_KEY,
        });
    }

    if (launchServices.includes(Service.Kafka)) {
        Object.assign(env, {
            KAFKA_BROKER: config.KAFKA_BROKER,
            KAFKA_VERSION: config.KAFKA_VERSION,
        });
    }

    if (launchServices.includes(Service.RabbitMQ)) {
        Object.assign(env, {
            RABBITMQ_HOSTNAME: config.RABBITMQ_HOSTNAME,
            RABBITMQ_USER: config.RABBITMQ_USER,
            RABBITMQ_VERSION: config.RABBITMQ_VERSION,
            RABBITMQ_PORT: config.RABBITMQ_PORT,
            RABBITMQ_MANAGEMENT_PORT: config.RABBITMQ_MANAGEMENT_PORT,
            RABBITMQ_PASSWORD: config.RABBITMQ_PASSWORD,
        });
    }

    if (launchServices.includes(Service.Opensearch)) {
        Object.assign(env, {
            OPENSEARCH_HOSTNAME: config.OPENSEARCH_HOSTNAME,
            OPENSEARCH_USER: config.OPENSEARCH_USER,
            OPENSEARCH_PASSWORD: config.OPENSEARCH_PASSWORD,
            OPENSEARCH_PORT: config.OPENSEARCH_PORT,
            OPENSEARCH_VERSION: config.OPENSEARCH_VERSION,
            OPENSEARCH_HOST: config.OPENSEARCH_HOST,
            DISABLE_SECURITY_PLUGIN: true,
            DISABLE_INSTALL_DEMO_CONFIG: true,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`
        });
    }

    if (launchServices.includes(Service.RestrainedOpensearch)) {
        Object.assign(env, {
            OPENSEARCH_HOSTNAME: config.OPENSEARCH_HOSTNAME,
            OPENSEARCH_USER: config.OPENSEARCH_USER,
            OPENSEARCH_PASSWORD: config.OPENSEARCH_PASSWORD,
            RESTRAINED_OPENSEARCH_PORT: config.RESTRAINED_OPENSEARCH_PORT,
            OPENSEARCH_VERSION: config.OPENSEARCH_VERSION,
            RESTRAINED_OPENSEARCH_HOST: config.RESTRAINED_OPENSEARCH_HOST,
            DISABLE_SECURITY_PLUGIN: true,
            DISABLE_INSTALL_DEMO_CONFIG: true,
            SEARCH_TEST_HOST: `${config.SEARCH_TEST_HOST}`
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

/**
 * Generates CA certificates for encrypted services in the test environment if needed
 *
 * @throws {Error} If certificate generation fails.
 */
export async function generateTestCaCerts(): Promise<void> {
    const encryptedServices: string[] = [];
    const hostNames: string[] = ['localhost'];

    if (config.ENCRYPT_OPENSEARCH) {
        encryptedServices.push('opensearch');
        hostNames.push(
            'opensearch2.services-dev1',
            'opensearch',
            config.OPENSEARCH_HOSTNAME
        );
    }

    if (config.ENCRYPT_MINIO) {
        encryptedServices.push('minio');
        hostNames.push(
            'minio.services-dev1',
            'minio',
            config.MINIO_HOSTNAME
        );
    }

    if (config.ENCRYPT_KAFKA) {
        encryptedServices.push('kafka');
        hostNames.push(
            'kafka-headless.services-dev1.svc.cluster.local',
            'kafka-headless.services-dev1',
            'kafka-headless',
            'kafka',
            config.KAFKA_HOSTNAME
        );
    }

    if (encryptedServices.length > 0) {
        // Formats the encrypted service list to print with the user feedback
        const serviceList = encryptedServices.length === 1
            ? encryptedServices[0]
            : encryptedServices.length === 2
                ? encryptedServices.join(' and ')
                : `${encryptedServices.slice(0, -1).join(', ')} and ${encryptedServices[encryptedServices.length - 1]}`;

        try {
            signale.pending(`Generating new ca-certificates for ${serviceList}...`);
            const scriptLocation = path.join(getE2EDir() as string, '../scripts/generate-cert.sh');

            // create a format array for each service
            const formatCommands: string[] = [];
            encryptedServices.forEach((service) => {
                formatCommands.push('--format');
                formatCommands.push(service);
            });

            signale.debug('Generate certs command: ', `${scriptLocation} ${formatCommands.concat(hostNames)}`);
            await execa(scriptLocation, formatCommands.concat(hostNames));
        } catch (err) {
            throw new Error(`Error generating ca-certificates for ${serviceList}: ${err.message}`);
        }
    }
}

/**
 * Generates a secret that contains the minio certs and keys
 * used by the minio helm chart when enabling tls.
 * @param k8sClient The Kubernetes k8s client
 */
export async function createMinioSecret(k8sClient: K8s): Promise<void> {
    // Grab all needed cert file paths generated by the generateTestCaCerts() function
    const e2eDir = getE2EDir() as string;
    const certsDir = path.join(e2eDir, './test/certs/');
    const privateKeypath = path.join(certsDir, 'private.key');
    const publicCertPath = path.join(certsDir, 'public.crt');
    const rootCaPath = path.join(certsDir, '/CAs/rootCA.pem');

    // ensure all necessary files exist
    if (fse.existsSync(privateKeypath)
        && fse.existsSync(publicCertPath)
        && fse.existsSync(rootCaPath)
    ) {
        try {
            // Read in all certs as strings
            const privateKey = fse.readFileSync(privateKeypath, 'utf-8');
            const publicCert = fse.readFileSync(publicCertPath, 'utf-8');
            const rootCA = fse.readFileSync(rootCaPath, 'utf-8');

            // Create a k8s V1Secret object that is used by the k8s client
            const minioSecret = {
                metadata: {
                    name: 'tls-ssl-minio'
                },
                stringData: {
                    'private.key': privateKey,
                    'public.crt': publicCert,
                    'rootCA.pem': rootCA
                },
                type: 'Opaque'
            };

            // create k8s client and deploy secret
            await k8sClient.createKubernetesSecret('services-dev1', minioSecret);
        } catch (err) {
            throw new TSError(`Unable to create minio secret for certificates.\n ${err}`);
        }
    } else {
        throw new Error(
            'Unable to find all needed minio certificates. One or more paths don\'t exist:\n'
            + `- ${privateKeypath}\n`
            + `- ${publicCertPath}\n`
            + `- ${rootCaPath}\n`
        );
    }
}
