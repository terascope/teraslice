import ms from 'ms';
import net from 'node:net';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import got, { Response } from 'got';
import semver from 'semver';
import fs from 'fs-extra';
import path from 'node:path';
import { dump, load } from 'js-yaml';
import { Kafka } from 'kafkajs';
import { execa } from 'execa';
import {
    pWhile, TSError, debugLogger,
    getErrorStatusCode, isKey, toHumanTime
} from '@terascope/core-utils';
import { Service } from '@terascope/types';
import { Compose } from '@terascope/docker-compose-js';
import { getServicesForSuite, getRootDir, logTCPPorts } from '../misc.js';
import {
    dockerRun, DockerRunOptions, getContainerInfo, dockerStop,
    loadThenDeleteImageFromCache, dockerPull, dockerBuild,
    dockerExec
} from '../docker.js';
import { getAdminDnFromCert } from '../certs.js';
import { Kind } from '../kind.js';
import { isOpenSearchInfo, TestOptions } from './interfaces.js';
import config, { resolveTerasliceVersion } from '../config.js';
import signale from '../signale.js';

const logger = debugLogger('ts-scripts:cmd:test');

const serviceUpTimeout = ms(config.SERVICE_UP_TIMEOUT);

const rabbitConfigPath = path.join(getRootDir(), '/.ts-test-config/rabbitmq.conf');
const opensearchConfigPath = path.join(getRootDir(), '/.ts-test-config/opensearch.yml');

// Resolve relative to this compiled file so it works regardless of whatever
// repo uses scripts.
// dist/src/helpers/test-runner/services.js -> up 4 levels --> scripts package root
const scriptsDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..'
);

const cephDir = path.join(scriptsDir, 'docker', 'ceph');
const cephComposeFile = path.join(cephDir, 'docker-compose.yml');
// Deliberately next to the compose file: compose picks up `<project dir>/.env`
// automatically for `${VAR}` interpolation, and the `env_file: .env` on the
// x-ceph anchor (which resolves against the compose file, not the cwd) injects
// the same values into the containers. Two different mechanisms, one file.
const cephEnvFile = path.join(cephDir, '.env');
const cephProjectName = `${config.TEST_NAMESPACE}_${config.CEPH_NAME}`;

// Everything except Ceph, which is a compose stack rather than a single
// `docker run` and so has no entry in `services` below.
type DockerService = Exclude<Service, Service.Ceph>;

const services: Readonly<Record<DockerService, Readonly<DockerRunOptions>>> = {
    [Service.RestrainedOpensearch]: {
        image: config.OPENSEARCH_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.OPENSEARCH_NAME}`,
        mount: config.ENCRYPT_OPENSEARCH
            ? [
                `type=bind,source=${config.CERT_PATH},target=/usr/share/opensearch/config/certs`,
                `type=bind,source=${opensearchConfigPath},target=/usr/share/opensearch/config/opensearch.yml`
            ]
            : [`type=bind,source=${opensearchConfigPath},target=/usr/share/opensearch/config/opensearch.yml`],
        ports: [`${config.RESTRAINED_OPENSEARCH_PORT}:${config.RESTRAINED_OPENSEARCH_PORT}`],
        env: {
            OPENSEARCH_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.RESTRAINED_OPENSEARCH_PORT,
            'discovery.type': 'single-node',
            DISABLE_INSTALL_DEMO_CONFIG: true,
            DISABLE_SECURITY_PLUGIN: !config.ENCRYPT_OPENSEARCH,
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.Opensearch]: {
        image: config.OPENSEARCH_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.OPENSEARCH_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/usr/share/opensearch/data:uid=1000,gid=1000']
            : undefined,
        mount: config.ENCRYPT_OPENSEARCH
            ? [
                `type=bind,source=${config.CERT_PATH},target=/usr/share/opensearch/config/certs`,
                `type=bind,source=${opensearchConfigPath},target=/usr/share/opensearch/config/opensearch.yml`
            ]
            : [],
        ports: [`${config.OPENSEARCH_PORT}:${config.OPENSEARCH_PORT}`],
        env: {
            OPENSEARCH_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.OPENSEARCH_PORT,
            'discovery.type': 'single-node',
            DISABLE_INSTALL_DEMO_CONFIG: true,
            DISABLE_SECURITY_PLUGIN: !config.ENCRYPT_OPENSEARCH,
            DISABLE_PERFORMANCE_ANALYZER_AGENT_CLI: 'true'
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.Kafka]: {
        image: config.KAFKA_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.KAFKA_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/tmp/kafka-logs:uid=1000,gid=1000']
            : undefined,
        mount: config.ENCRYPT_KAFKA
            ? [`type=bind,source=${config.CERT_PATH},target=${config.KAFKA_SECRETS_DIR}`]
            : [],
        ports: [`${config.KAFKA_PORT}:${config.KAFKA_PORT}`],
        env: {
            KAFKA_NODE_ID: config.KAFKA_NODE_ID,
            KAFKA_PROCESS_ROLES: config.KAFKA_PROCESS_ROLES,
            KAFKA_LISTENERS: config.KAFKA_LISTENERS,
            KAFKA_ADVERTISED_LISTENERS: config.KAFKA_ADVERTISED_LISTENERS,
            KAFKA_CONTROLLER_LISTENER_NAMES: config.KAFKA_CONTROLLER_LISTENER_NAMES,
            KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: config.KAFKA_LISTENER_SECURITY_PROTOCOL_MAP,
            KAFKA_CONTROLLER_QUORUM_VOTERS: config.KAFKA_CONTROLLER_QUORUM_VOTERS,
            KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: config.KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR,
            KAFKA_INTER_BROKER_LISTENER_NAME: config.KAFKA_INTER_BROKER_LISTENER_NAME,
            KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: `${config.KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR}`,
            KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: config.KAFKA_TRANSACTION_STATE_LOG_MIN_ISR,
            KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: config.KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS,
            KAFKA_AUTO_CREATE_TOPICS_ENABLE: config.KAFKA_AUTO_CREATE_TOPICS_ENABLE,
            // TLS related config
            ...(config.ENCRYPT_KAFKA
                ? {
                    KAFKA_SECURITY_PROTOCOL: 'ssl',
                    KAFKA_SSL_CLIENT_AUTH: 'none',
                    KAFKA_SSL_KEYSTORE_LOCATION: '/etc/kafka/secrets/kafka-keypair.pem',
                    KAFKA_SSL_KEYSTORE_TYPE: 'PEM',
                    KAFKA_SSL_TRUSTSTORE_LOCATION: '/etc/kafka/secrets/CAs/rootCA.pem',
                    KAFKA_SSL_TRUSTSTORE_TYPE: 'PEM',
                }
                : {}),
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.Minio]: {
        image: config.MINIO_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.MINIO_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/data']
            : undefined,
        ports: [`${config.MINIO_PORT}:${config.MINIO_PORT}`, `${config.MINIO_UI_PORT}:${config.MINIO_UI_PORT}`],
        mount: config.ENCRYPT_MINIO
            ? [`type=bind,source=${config.CERT_PATH},target=/opt/certs`]
            : [],
        env: {
            MINIO_ACCESS_KEY: config.MINIO_ACCESS_KEY,
            MINIO_SECRET_KEY: config.MINIO_SECRET_KEY,
        },
        network: config.DOCKER_NETWORK_NAME,
        args: config.ENCRYPT_MINIO
            ? ['server', '-S', '/opt/certs', '--address', `0.0.0.0:${config.MINIO_PORT}`, '--console-address', `:${config.MINIO_UI_PORT}`, '/data']
            : ['server', '--address', `0.0.0.0:${config.MINIO_PORT}`, '--console-address', `:${config.MINIO_UI_PORT}`, '/data']
    },
    [Service.RabbitMQ]: {
        image: config.RABBITMQ_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.RABBITMQ_NAME}`,
        ports: [`${config.RABBITMQ_MANAGEMENT_PORT}:15672`, `${config.RABBITMQ_PORT}:5672`],
        mount: [`type=bind,source=${rabbitConfigPath},target=/etc/rabbitmq/rabbitmq.conf`],
        env: {
            RABBITMQ_HOSTNAME: '0.0.0.0',
            RABBITMQ_MANAGEMENT_ALLOW_WEB_ACCESS: 'true',
            RABBITMQ_USERNAME: config.RABBITMQ_USER,
            RABBITMQ_PASSWORD: config.RABBITMQ_PASSWORD,
        },
        network: config.DOCKER_NETWORK_NAME,
    },
    [Service.Utility]: {
        image: config.UTILITY_SVC_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.UTILITY_SVC_NAME}`,
        network: config.DOCKER_NETWORK_NAME,
    },
    [Service.Valkey]: {
        image: config.VALKEY_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.VALKEY_NAME}`,
        ports: [`${config.VALKEY_PORT}:${config.VALKEY_PORT}`],
        network: config.DOCKER_NETWORK_NAME,
        args: ['--port', config.VALKEY_PORT.toString(), '--save', ''],
    },
    [Service.Teraslice]: {
        image: config.TERASLICE_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_teraslice`,
        ports: [`${config.TERASLICE_PORT}:5678`],
        network: config.DOCKER_NETWORK_NAME,
    }
};

export function startServiceLogging(launchServices: Service[], logsDir: string): () => void {
    fs.mkdirSync(logsDir, { recursive: true });

    const subprocesses: ReturnType<typeof execa>[] = [];
    const loggedContainers = new Set<string>();

    for (const service of launchServices) {
        // Ceph is a compose stack, not a single container, so it has no entry in
        // `services` and needs `compose logs` to cover all containers.
        if (service === Service.Ceph) {
            const logFilePath = path.join(logsDir, `${service}.log`);
            signale.info(`Piping ${cephProjectName} docker compose logs to ${logFilePath}`);

            const logStream = fs.createWriteStream(logFilePath);
            const subprocess = execa(
                'docker',
                ['compose', '-f', cephComposeFile, 'logs', '-f', '--no-color'],
                { all: true, env: { COMPOSE_PROJECT_NAME: cephProjectName } }
            );

            subprocess.all?.pipe(logStream);
            subprocess.catch(() => {});

            subprocesses.push(subprocess);
            continue;
        }

        const containerName = services[service]?.name;
        if (!containerName || loggedContainers.has(containerName)) continue;
        loggedContainers.add(containerName);

        const logFilePath = path.join(logsDir, `${service}.log`);
        signale.info(`Piping ${containerName} docker logs to ${logFilePath}`);

        const logStream = fs.createWriteStream(logFilePath);
        const subprocess = execa('docker', ['logs', '-f', containerName], { all: true });

        subprocess.all?.pipe(logStream);
        subprocess.catch(() => {});

        subprocesses.push(subprocess);
    }
    // Wait up to 10s for docker logs to flush before force-killing.
    return async () => {
        await Promise.all(
            subprocesses.map(async (subprocess) => {
                const timeout = new Promise<void>((resolve) => setTimeout(resolve, ms('10s')));
                await Promise.race([subprocess.catch(() => {}), timeout]);
                subprocess.kill();
            })
        );
    };
}

export async function loadOrPullServiceImages(
    suite: string,
    skipImageDeletion: boolean
): Promise<void> {
    const launchServices = getServicesForSuite(suite);

    try {
        const images: string[] = [];
        const loadFailedList: string[] = [];

        if (launchServices.includes(Service.Opensearch)) {
            const image = `${config.OPENSEARCH_DOCKER_IMAGE}:${config.OPENSEARCH_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.RestrainedOpensearch)) {
            const image = `${config.OPENSEARCH_DOCKER_IMAGE}:${config.OPENSEARCH_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Kafka)) {
            const image = `${config.KAFKA_DOCKER_IMAGE}:${config.KAFKA_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Minio)) {
            const image = `${config.MINIO_DOCKER_IMAGE}:${config.MINIO_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Ceph)) {
            const image = `${config.CEPH_DOCKER_IMAGE}:${config.CEPH_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.RabbitMQ)) {
            const image = `${config.RABBITMQ_DOCKER_IMAGE}:${config.RABBITMQ_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Utility)) {
            const image = `${config.UTILITY_SVC_DOCKER_IMAGE}:${config.UTILITY_SVC_VERSION}`;
            images.push(image);
        }

        if (fs.existsSync(config.DOCKER_CACHE_PATH)) {
            await Promise.all(images.map(async (imageName) => {
                const success = await loadThenDeleteImageFromCache(imageName, skipImageDeletion);
                if (!success) {
                    loadFailedList.push(imageName);
                }
            }));
        } else {
            loadFailedList.push(...images);
        }

        if (loadFailedList.length > 0) {
            await Promise.all(loadFailedList.map(async (image) => {
                const label = `docker pull ${image}`;
                signale.time(label);
                await dockerPull(image);
                signale.timeEnd(label);
            }));
        }
    } catch (err) {
        throw new TSError(err, {
            message: `Failed to pull services for test suite "${suite}", ${err.message}`
        });
    }
}

export async function ensureServices(
    suite: string, options: TestOptions, logsDir?: string
): Promise<() => void> {
    const launchServices = getServicesForSuite(suite);
    const promises: Promise<(() => void) | (() => Promise<void>)>[] = [];

    if (launchServices.includes(Service.RestrainedOpensearch)) {
        if (config.ENCRYPT_OPENSEARCH) {
            throw new Error('Restrained Opensearch is not compatible with an encrypted opensearch');
        }

        // we create the opensearch.yml file for tests
        if (!options.ignoreMount) {
            await fs.outputFile(opensearchConfigPath, 'network.host: 0.0.0.0\nthread_pool.write.queue_size: 2');
        }
        promises.push(ensureRestrainedOpensearch(options));
    }

    if (launchServices.includes(Service.Opensearch)) {
        // we create the opensearch.yml file for tests
        if (!options.ignoreMount && config.ENCRYPT_OPENSEARCH) {
            const encryptedOpensearchConfigProps = [
                'plugins.security.ssl.transport.pemcert_filepath: certs/opensearch-cert.pem',
                'plugins.security.ssl.transport.pemkey_filepath: certs/opensearch-key.pem',
                'plugins.security.ssl.transport.pemtrustedcas_filepath: certs/CAs/rootCA.pem',
                'plugins.security.ssl.http.enabled: true',
                'plugins.security.ssl.http.pemcert_filepath: certs/opensearch-cert.pem',
                'plugins.security.ssl.http.pemkey_filepath: certs/opensearch-key.pem',
                'plugins.security.ssl.http.pemtrustedcas_filepath: certs/CAs/rootCA.pem',
                `plugins.security.authcz.admin_dn:`,
                `  - ${getAdminDnFromCert()}`
            ];
            await fs.outputFile(opensearchConfigPath, encryptedOpensearchConfigProps.join('\n'));
        }
        promises.push(ensureOpensearch(options));
    }

    if (launchServices.includes(Service.Kafka)) {
        promises.push(ensureKafka(options));
    }

    if (launchServices.includes(Service.Minio)) {
        promises.push(ensureMinio(options));
    }

    if (launchServices.includes(Service.Ceph)) {
        promises.push(ensureCeph(options));
    }

    if (launchServices.includes(Service.RabbitMQ)) {
        // we create the rabbitmq.conf file for tests
        if (!options.ignoreMount) {
            await fs.outputFile(rabbitConfigPath, 'loopback_users = none\nloopback_users.guest = false');
        }

        promises.push(ensureRabbitMQ(options));
    }

    if (launchServices.includes(Service.Utility)) {
        promises.push(ensureUtility(options));
    }

    if (launchServices.includes(Service.Valkey)) {
        promises.push(ensureValkey(options));
    }

    const fns = await Promise.all(promises);

    // Teraslice depends on OpenSearch being up, so start it after the parallel services
    let terasliceFn = () => { };
    if (launchServices.includes(Service.Teraslice)) {
        terasliceFn = await ensureTeraslice(options, launchServices);
    }

    const stopLogging = (options.logs && logsDir)
        ? startServiceLogging(launchServices, logsDir)
        : () => {};

    return async () => {
        // Awaited, not fire-and-forget: Ceph's teardown is a `compose down -v`,
        // so without this the process could exit with the stack still running.
        await Promise.all(fns.map((fn) => fn()));
        terasliceFn();
        await stopLogging();
    };
}

export async function ensureKafka(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.Kafka);
    await checkKafka(options, startTime);
    return fn;
}

export async function ensureMinio(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.Minio);
    await checkMinio(options, startTime);
    return fn;
}

/**
 * Ceph is the one service that isn't a single `docker run`: it is a multi
 * container compose stack whose ordering is necessary for it to work. So it is
 * driven through docker compose rather than added to the `services` record
 * above, and every `services[service]` call site skips it.
 */
function getCephCompose(): Compose {
    return new Compose(cephComposeFile, {
        env: { COMPOSE_PROJECT_NAME: cephProjectName }
    });
}

/**
 * Render the compose env file from config. This is the single source for both
 * compose interpolation and the values the container scripts read, because
 * compose's precedence (`environment:` > shell env > `env_file`) means a shell
 * export reaches interpolation but *not* the containers -- which would publish
 * one port while RGW listened on another.
 */
async function writeCephEnv(): Promise<void> {
    const lines = [
        '# GENERATED by ts-scripts from packages/scripts/src/helpers/config.ts.',
        '# Overwritten on every run -- change the CEPH_* config defaults instead.',
        `CEPH_IMAGE=${config.CEPH_DOCKER_IMAGE}:${config.CEPH_VERSION}`,
        '',
        `RGW_PORT=${config.CEPH_PORT}`,
        `S3_ENDPOINT=http://rgw:${config.CEPH_PORT}`,
        '',
        `S3_ACCESS_KEY=${config.CEPH_ACCESS_KEY}`,
        `S3_SECRET_KEY=${config.CEPH_SECRET_KEY}`,
        `S3_USER=${config.CEPH_USER}`,
        '',
        `OSD_COUNT=${config.CEPH_OSD_COUNT}`,
        `OSD_SIZE=${config.CEPH_OSD_SIZE}`,
        ''
    ];

    await fs.outputFile(cephEnvFile, lines.join('\n'));
}

export async function ensureCeph(options: TestOptions): Promise<() => Promise<void>> {
    const startTime = Date.now();
    const version = config.CEPH_VERSION;

    if (options.useExistingServices) {
        signale.warn(`expecting ${Service.Ceph}@${version} to be running (this can be dangerous)...`);
        return async () => {};
    }

    const compose = getCephCompose();

    await writeCephEnv();

    // A crashed previous run can leave volumes holding a cluster built from
    // different config -- pool size only applies at creation, so reusing those
    // volumes would silently ignore whatever changed.
    await compose.down({ v: '', 'remove-orphans': '' });

    signale.pending(`starting ${Service.Ceph}@${version} service...`);
    await logTCPPorts(Service.Ceph);

    const teardown = async () => {
        try {
            await compose.down({ v: '', 'remove-orphans': '' });
        } catch (err) {
            signale.error(
                new TSError(err, {
                    reason: `Failed to stop ${Service.Ceph}@${version} service`,
                })
            );
        }
    };

    await compose.up({});

    try {
        await checkCeph(options, startTime);
    } catch (err) {
        await teardown();
        throw err;
    }

    return teardown;
}

export async function ensureRestrainedOpensearch(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.RestrainedOpensearch);
    await checkRestrainedOpensearch(options, startTime);
    return fn;
}

export async function ensureOpensearch(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.Opensearch);
    if (config.ENCRYPT_OPENSEARCH) {
        await checkOpensearch(options, startTime, true);
        await securityAdminSetup(config.OPENSEARCH_PORT);
    }
    await checkOpensearch(options, startTime);
    return fn;
}

export async function ensureRabbitMQ(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.RabbitMQ);
    await checkRabbitMQ(options, startTime);
    return fn;
}

export async function ensureUtility(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.Utility);
    await checkUtility(options, startTime);
    return fn;
}

export async function ensureValkey(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.Valkey);
    await checkValkey(options, startTime);
    return fn;
}

export async function ensureTeraslice(
    options: TestOptions, launchServices: Service[]
): Promise<() => void> {
    await resolveTerasliceVersion();

    const configPath = writeTerasliceConfig(launchServices, options);
    const configMount = `type=bind,source=${configPath},target=/app/config/teraslice.yaml`;

    if (config.TERASLICE_DOCKER_VOLUME_PATHS) {
        return ensureTerasliceWithDevPackages(options, configMount);
    }

    const startTime = Date.now();
    const fn = await startService(options, Service.Teraslice, {
        mount: [configMount],
    });
    await checkTeraslice(options, startTime);
    return fn;
}

async function ensureTerasliceWithDevPackages(
    options: TestOptions, configMount: string
): Promise<() => void> {
    const volumePaths: string[] = config.TERASLICE_DOCKER_VOLUME_PATHS!
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean);

    // Map each host path to a deterministic container path using its basename
    type DevMount = { hostPath: string; containerPath: string };
    const devMounts: DevMount[] = volumePaths.map((hostPath: string) => ({
        hostPath,
        containerPath: `/mnt/dev/${path.basename(hostPath)}`,
    }));

    const baseImage = config.TERASLICE_IMAGE
        ?? `${config.TERASLICE_DOCKER_IMAGE}:${config.TERASLICE_VERSION}`;

    const assetE2eImage = 'teraslice-asset-e2e';
    const assetE2eTag = 'local';
    const dockerfile = path.join(scriptsDir, 'docker', 'asset-e2e', 'Dockerfile');

    signale.pending(`Building asset e2e image from ${baseImage}...`);
    await dockerBuild(
        `${assetE2eImage}:${assetE2eTag}`,
        [],
        undefined,
        [`TERASLICE_IMAGE=${baseImage}`],
        dockerfile,
        scriptsDir
    );
    signale.success(`Built asset e2e image: ${assetE2eImage}:${assetE2eTag}`);

    const terasliceService = services[Service.Teraslice];
    await stopService(Service.Teraslice);

    const startTime = Date.now();
    const fn = await dockerRun(
        {
            ...terasliceService,
            image: assetE2eImage,
            mount: [
                configMount,
                ...devMounts.map((m) => `type=bind,source=${m.hostPath},target=${m.containerPath}`),
            ],
            env: {
                ...terasliceService.env,
                TERASLICE_DEV_PACKAGES: devMounts.map((m) => m.containerPath).join(','),
            },
        },
        assetE2eTag,
        options.ignoreMount,
        options.debug || options.trace
    );

    await checkTeraslice(options, startTime);
    return fn;
}

function writeTerasliceConfig(launchServices: Service[], options: TestOptions): string {
    const logLevel = options.trace
        ? 'trace'
        : options.debug
            ? 'debug'
            : 'info';

    const opensearchNode = `${config.OPENSEARCH_PROTOCOL}://${config.OPENSEARCH_HOSTNAME}:${config.OPENSEARCH_PORT}`;

    const connectors: Record<string, any> = {
        'elasticsearch-next': {
            default: {
                node: [opensearchNode],
            }
        }
    };

    if (launchServices.includes(Service.Kafka)) {
        connectors.kafka = {
            default: {
                brokers: [config.KAFKA_BROKER],
                security_protocol: 'plaintext',
            }
        };
    }

    if (launchServices.includes(Service.Minio)) {
        connectors.s3 = {
            default: {
                endpoint: config.MINIO_HOST,
                accessKeyId: config.MINIO_ACCESS_KEY,
                secretAccessKey: config.MINIO_SECRET_KEY,
                forcePathStyle: true,
                sslEnabled: false,
                region: 'us-east-1',
            }
        };
    }

    if (launchServices.includes(Service.Ceph)) {
        connectors.s3 = {
            default: {
                endpoint: config.CEPH_HOST,
                accessKeyId: config.CEPH_ACCESS_KEY,
                secretAccessKey: config.CEPH_SECRET_KEY,
                forcePathStyle: true,
                sslEnabled: false,
                // RGW validates this against its zonegroup, so it is not free
                // form the way it was under MinIO.
                region: 'us-east-1',
            }
        };
    }

    if (launchServices.includes(Service.Valkey)) {
        connectors.valkey = {
            default: {
                addresses: [{ host: config.VALKEY_HOST, port: config.VALKEY_PORT }]
            }
        };
    }

    const cfg = {
        terafoundation: {
            log_level: logLevel,
            workers: 1,
            connectors,
        },
        teraslice: {
            master: true,
            master_hostname: '127.0.0.1',
            port: 5678,
            name: `${config.TEST_NAMESPACE}_teraslice`,
            cluster_manager_type: 'native',
            asset_storage_connection_type: config.ASSET_STORAGE_CONNECTION_TYPE,
            asset_storage_connection: config.ASSET_STORAGE_CONNECTION,
            assets_directory: '/app/assets',
            index_settings: {
                analytics: { number_of_replicas: 0 },
                assets: { number_of_replicas: 0 },
                execution: { number_of_replicas: 0 },
                jobs: { number_of_replicas: 0 },
                state: { number_of_replicas: 0 },
            }
        }
    };

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-teraslice-'));
    const configPath = path.join(tmpDir, 'teraslice.yaml');
    const yamlContent = dump(cfg);
    fs.outputFileSync(configPath, yamlContent);
    signale.debug(`teraslice.yaml:\n${yamlContent}`);
    return configPath;
}

async function checkTeraslice(options: TestOptions, startTime: number): Promise<void> {
    const host = config.TERASLICE_HOST;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking teraslice at ${host}`);
            } else {
                logger.debug(`checking teraslice at ${host}`);
            }

            let body: any;
            try {
                ({ body } = await got(host, {
                    responseType: 'json',
                    throwHttpErrors: true,
                    retry: { limit: 0 },
                    timeout: { request: 5000 }
                }));
            } catch (err) {
                error = err.message;
                return false;
            }

            if (body?.teraslice_version) {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`teraslice@${body.teraslice_version} is running at ${host}, took ${took}`);
                return true;
            }

            return false;
        },
        {
            name: `Teraslice service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function stopService(service: DockerService) {
    const { name } = services[service];
    const info = await getContainerInfo(name);
    if (!info) return;

    const startTime = Date.now();
    signale.pending(`stopping service ${service}`);
    await dockerStop(name);
    signale.success(`stopped service ${service}, took ${toHumanTime(Date.now() - startTime)}`);
}

async function checkRestrainedOpensearch(
    options: TestOptions, startTime: number
): Promise<void> {
    const host = config.RESTRAINED_OPENSEARCH_HOST;
    const username = config.OPENSEARCH_USER;
    const password = config.OPENSEARCH_PASSWORD;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.OPENSEARCH_HOSTNAME)) return;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking restrained opensearch at ${host}`);
            } else {
                logger.debug(`checking restrained opensearch at ${host}`);
            }
            let body: any;

            try {
                ({ body } = await got(host, {
                    username,
                    password,
                    https: { rejectUnauthorized: false },
                    responseType: 'json',
                    throwHttpErrors: true,
                    retry: {
                        limit: 0
                    }
                }));
            } catch (err) {
                error = err.message;
                return false;
            }

            if (options.trace) {
                signale.debug('got response from restrained opensearch service', body);
            } else {
                logger.debug('got response from restrained opensearch service', body);
            }

            if (!body?.version?.number) {
                return false;
            }

            const actual: string = body.version.number;
            const expected = config.OPENSEARCH_VERSION;

            if (semver.satisfies(actual, `~${expected}`)) {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`restrained opensearch@${actual} is running at ${host}, took ${took}`);
                return true;
            }

            throw new TSError(
                `restrained opensearch at ${host} does not satisfy required version of ${expected}, got ${actual}`,
                {
                    retryable: false,
                }
            );
        },
        {
            name: `Restrained Opensearch service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function checkOpensearch(
    options: TestOptions,
    startTime: number,
    needsSecurityInit = false
): Promise<void> {
    const host = config.OPENSEARCH_HOST;
    const username = config.OPENSEARCH_USER;
    const password = config.OPENSEARCH_PASSWORD;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.OPENSEARCH_HOSTNAME)) return;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking opensearch at ${host}`);
            } else {
                logger.debug(`checking opensearch at ${host}`);
            }
            let response: Response;

            try {
                response = await got(host, {
                    username,
                    password,
                    https: { rejectUnauthorized: false },
                    responseType: 'json',
                    throwHttpErrors: false,
                    retry: {
                        limit: 0
                    }
                });
            } catch (err) {
                error = err.message;
                return false;
            }

            if (options.trace) {
                signale.debug('got response from opensearch service: ', response.body);
            } else {
                logger.debug('got response from opensearch service: ', response.body);
            }

            if (needsSecurityInit) {
                // ready for securityadmin container to run
                return response.statusCode === 503 && typeof response.body === 'string' && response.body.includes('OpenSearch Security not initialized');
            }

            if (response.statusCode === 200 && isOpenSearchInfo(response.body)) {
                if (!response.body?.version?.number) {
                    return false;
                }

                const actual: string = response.body.version.number;
                const expected = config.OPENSEARCH_VERSION;

                if (semver.satisfies(actual, `~${expected}`)) {
                    const took = toHumanTime(Date.now() - startTime);
                    signale.success(`opensearch@${actual} is running at ${host}, took ${took}`);
                    return true;
                }

                throw new TSError(
                    `Opensearch at ${host} does not satisfy required version of ${expected}, got ${actual}`,
                    {
                        retryable: false,
                    }
                );
            }
        },
        {
            name: `Opensearch service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function checkMinio(options: TestOptions, startTime: number): Promise<void> {
    const host = config.MINIO_HOST;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.MINIO_HOSTNAME)) return;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking MinIO at ${host}`);
            } else {
                logger.debug(`checking MinIO at ${host}`);
            }

            let statusCode: number;
            const rootCaPath = path.join(config.CERT_PATH, 'CAs/rootCA.pem');
            try {
                ({ statusCode } = await got('minio/health/live', {
                    prefixUrl: host,
                    responseType: 'json',
                    throwHttpErrors: false,
                    https: config.ENCRYPT_MINIO
                        ? { certificateAuthority: fs.readFileSync(rootCaPath) }
                        : {},
                    retry: {
                        limit: 0
                    }
                }));
            } catch (err) {
                error = err.message;
                statusCode = getErrorStatusCode(err);
            }

            if (options.trace) {
                signale.debug('got response from MinIO service', { statusCode });
            } else {
                logger.debug('got response from MinIO service', { statusCode });
            }

            if (statusCode === 200) {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`MinIO is running at ${host}, took ${took}`);
                return true;
            }
            return false;
        },
        {
            name: `MinIO service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

/**
 * Read the `setup` script's exit code, or undefined while it is still running.
 *
 * `--format=json` prints either a JSON array or one object per line depending
 * on the compose version, so both are handled.
 */
async function getCephSetupExitCode(compose: Compose): Promise<number | undefined> {
    // `-a` matters: without it an exited container is not listed at all, which
    // is indistinguishable from one that has not started yet.
    const raw = await compose.runCmd('ps', { a: '', format: 'json' }, 'setup');

    const rows = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
            try {
                const parsed = JSON.parse(line);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return [];
            }
        });

    const [setup] = rows;
    if (!setup || setup.State !== 'exited') return undefined;
    return setup.ExitCode;
}

/**
 * Wait for the `setup` script, not for the containers.
 *
 * `compose ps -a` is timing-independent: the exited container stays listed.
 * Pair it with an anonymous `GET /`, which confirms RGW is actually serving
 */
async function checkCeph(options: TestOptions, startTime: number): Promise<void> {
    const host = config.CEPH_HOST;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.CEPH_HOSTNAME)) return;

    const compose = getCephCompose();
    let error = '';

    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking Ceph at ${host}`);
            } else {
                logger.debug(`checking Ceph at ${host}`);
            }

            let exitCode: number | undefined;

            try {
                exitCode = await getCephSetupExitCode(compose);
            } catch (err) {
                error = err.message;
                return false;
            }

            if (exitCode == null) return false;

            if (exitCode !== 0) {
                // A one-shot script that failed will never succeed on a later poll, so
                // fail now instead of burning the whole timeout waiting for it.
                throw new TSError(
                    `Ceph setup container exited with code ${exitCode}, check the compose logs`
                );
            }

            let statusCode: number;

            try {
                ({ statusCode } = await got(host, {
                    throwHttpErrors: false,
                    retry: {
                        limit: 0
                    },
                    timeout: { request: 5000 }
                }));
            } catch (err) {
                error = err.message;
                statusCode = getErrorStatusCode(err);
            }

            if (options.trace) {
                signale.debug('got response from Ceph service', { statusCode });
            } else {
                logger.debug('got response from Ceph service', { statusCode });
            }

            if (statusCode === 200) {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`Ceph is running at ${host}, S3 user ready, took ${took}`);
                return true;
            }
            return false;
        },
        {
            name: `Ceph service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function checkRabbitMQ(options: TestOptions, startTime: number): Promise<void> {
    const managementEndpoint = config.RABBITMQ_MANAGEMENT;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.RABBITMQ_HOSTNAME)) return;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking RabbitMQ at ${managementEndpoint}`);
            } else {
                logger.debug(`checking RabbitMQ at ${managementEndpoint}`);
            }

            let statusCode: number;

            try {
                ({ statusCode } = await got('api/overview', {
                    prefixUrl: managementEndpoint,
                    responseType: 'json',
                    throwHttpErrors: false,
                    retry: {
                        limit: 0
                    },
                    username: config.RABBITMQ_USER,
                    password: config.RABBITMQ_PASSWORD
                }));
            } catch (err) {
                error = err.message;
                statusCode = getErrorStatusCode(err);
            }

            if (options.trace) {
                signale.debug('got response from RabbitMQ service', { statusCode });
            } else {
                logger.debug('got response from RabbitMQ service', { statusCode });
            }

            if (statusCode === 200) {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`RabbitMQ is running at ${managementEndpoint}, took ${took}`);
                return true;
            }

            return false;
        },
        {
            name: `RabbitMQ service (${managementEndpoint})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function checkKafka(options: TestOptions, startTime: number) {
    const host = config.KAFKA_HOSTNAME;
    const kafkaBroker = config.KAFKA_BROKER;
    const retryCount = 5;
    const retryTime = 10000;
    const totalTime = retryCount * retryTime;
    const rootCaPath = path.join(config.CERT_PATH, 'CAs/rootCA.pem');

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(host)) return;

    if (options.trace) {
        signale.debug(`checking kafka at ${host}`);
    } else {
        logger.debug(`checking kafka at ${host}`);
    }

    const kafka = new Kafka({
        clientId: 'tera-test',
        brokers: [kafkaBroker],
        logLevel: 0,
        retry: {
            initialRetryTime: retryTime,
            maxRetryTime: retryTime,
            factor: 0,
            retries: retryCount
        },
        ...(config.ENCRYPT_KAFKA
            ? { ssl: { ca: fs.readFileSync(rootCaPath) } }
            : {}
        )
    });
    const producer = kafka.producer();
    const took = toHumanTime(Date.now() - startTime);
    try {
        await producer.connect();
    } catch (err) {
        if (err.message.includes('ENOTFOUND') && err.message.includes(kafkaBroker)) {
            throw new Error(`Unable to connect to kafka broker after ${totalTime}ms at ${kafkaBroker}`);
        } else if (err.message.includes('ECONNREFUSED') && err.message.includes(kafkaBroker)) {
            throw new Error(`Unable to connect to kafka broker after ${totalTime}ms at ${kafkaBroker}`);
        }
        throw new Error(err.message);
    }
    signale.success(`kafka@${config.KAFKA_VERSION} is running at ${kafkaBroker}, took ${took}`);
}

async function checkUtility(options: TestOptions, startTime: number): Promise<void> {
    const took = toHumanTime(Date.now() - startTime);
    signale.success(`Utility Service **might** be running, took ${took}`);
}

async function checkValkey(options: TestOptions, startTime: number): Promise<void> {
    const host = config.VALKEY_HOSTNAME;
    const port = config.VALKEY_PORT;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.VALKEY_HOSTNAME)) return;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking Valkey at ${host}`);
            } else {
                logger.debug(`checking Valkey at ${host}`);
            }

            // remove when encryption supported
            if (config.ENCRYPT_VALKEY) {
                throw new Error('Valkey encryption not supported');
            }

            const response = await new Promise<string>((resolve) => {
                const socket = net.createConnection(port, host, () => {
                    socket.write('*1\r\n$4\r\nPING\r\n');
                });
                socket.setTimeout(5000);
                socket.once('data', (data) => {
                    socket.destroy();
                    // response: "+PONG\r\n" → "PONG"
                    resolve(data.toString().replace(/^\+/, '')
                        .trim());
                });
                socket.once('error', (err) => {
                    socket.destroy();
                    error = err.message;
                    resolve(err.message);
                });
                socket.once('timeout', () => {
                    socket.destroy();
                    error = 'Connection timed out';
                    resolve('Connection timed out');
                });
            });

            if (options.trace) {
                signale.debug('response from Valkey service: ', response);
            } else {
                logger.debug('response from Valkey service: ', response);
            }

            if (response === 'PONG') {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`Valkey is running at ${host}, took ${took}`);
                return true;
            }
            return false;
        },
        {
            name: `Valkey service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function startService(
    options: TestOptions,
    service: DockerService,
    extraDockerOpts?: Partial<DockerRunOptions>
): Promise<() => void> {
    let serviceName = service;

    if (serviceName === 'restrained_opensearch') {
        serviceName = Service.Opensearch;
    }

    let version: string;

    if (serviceName === 'kafka') {
        const key = 'KAFKA_VERSION';
        version = config[key];
        signale.pending(`starting ${service}@${config.KAFKA_VERSION} service...`);
    } else {
        const key = `${serviceName.toUpperCase()}_VERSION`;
        if (!isKey(config, key)) {
            throw new Error(`No version configuration variable found for ${serviceName}`);
        }
        version = config[key] as string;
        signale.pending(`starting ${service}@${version} service...`);
    }
    if (options.useExistingServices) {
        signale.warn(`expecting ${service}@${version} to be running (this can be dangerous)...`);
        return () => { };
    }

    await stopService(service);

    await logTCPPorts(serviceName);

    const fn = await dockerRun(
        { ...services[service], ...extraDockerOpts },
        version,
        options.ignoreMount,
        options.debug || options.trace
    );

    return () => {
        try {
            fn();
        } catch (err) {
            signale.error(
                new TSError(err, {
                    reason: `Failed to stop ${service}@${version} service`,
                })
            );
        }
    };
}

export async function loadImagesForHelm(kindClusterName: string, skipImageDeletion: boolean) {
    const kind = new Kind(config.K8S_VERSION, kindClusterName);
    const promiseArray: Promise<void>[] = [];

    config.ENV_SERVICES.forEach(async (service: Service) => {
        if (service === Service.Opensearch) {
            promiseArray.push(kind.loadServiceImage(
                service,
                config.OPENSEARCH_DOCKER_IMAGE,
                config.OPENSEARCH_VERSION,
                skipImageDeletion
            ));
        } else if (service === Service.Minio) {
            promiseArray.push(kind.loadServiceImage(
                service,
                config.MINIO_DOCKER_IMAGE,
                config.MINIO_VERSION,
                skipImageDeletion
            ));
        } else if (service === Service.Kafka) {
            promiseArray.push(kind.loadServiceImage(
                service,
                config.KAFKA_DOCKER_IMAGE,
                config.KAFKA_VERSION,
                skipImageDeletion
            ));
        } else if (service === Service.Utility) {
            promiseArray.push(kind.loadServiceImage(
                service,
                config.UTILITY_SVC_DOCKER_IMAGE,
                config.UTILITY_SVC_VERSION,
                skipImageDeletion
            ));
        } else if (service === Service.Valkey) {
            promiseArray.push(kind.loadServiceImage(
                service,
                config.VALKEY_DOCKER_IMAGE,
                config.VALKEY_VERSION,
                skipImageDeletion
            ));
        }
    });

    await Promise.all(promiseArray);
}

export async function loadImagesForHelmFromConfigFile(
    kindClusterName: string,
    configFilePath: string
) {
    const kind = new Kind(config.K8S_VERSION, kindClusterName);
    const customConfig = load(fs.readFileSync(configFilePath, 'utf8')) as any;
    const promiseArray: Promise<void>[] = [];

    for (const service in customConfig) {
        // Ensure the service is enabled
        if (customConfig[service].enabled === true) {
            // Handle all opensearch options
            if (service.includes(Service.Opensearch)) {
                promiseArray.push(kind.loadServiceImage(
                    Service.Opensearch,
                    config.OPENSEARCH_DOCKER_IMAGE,
                    customConfig[service].version,
                    false
                ));
            } else if (service === Service.Minio) {
                promiseArray.push(kind.loadServiceImage(
                    Service.Minio,
                    config.MINIO_DOCKER_IMAGE,
                    customConfig[service].version,
                    false
                ));
            } else if (service === Service.Kafka) {
                promiseArray.push(kind.loadServiceImage(
                    Service.Kafka,
                    customConfig[service].image || config.KAFKA_DOCKER_IMAGE,
                    customConfig[service].version,
                    false
                ));
            } else if (service === Service.Utility) {
                promiseArray.push(kind.loadServiceImage(
                    Service.Utility,
                    customConfig[service].image.repository,
                    customConfig[service].image.tag,
                    false
                ));
            } else if (service === Service.Valkey) {
                promiseArray.push(kind.loadServiceImage(
                    Service.Valkey,
                    config.VALKEY_DOCKER_IMAGE,
                    customConfig[service].image.tag,
                    false
                ));
            }
        }
    }
    await Promise.all(promiseArray);
}

async function securityAdminSetup(port: number) {
    await dockerExec(
        `${config.TEST_NAMESPACE}_${config.OPENSEARCH_NAME}`,
        [
            'bash',
            '-c',
            [
                'cp /usr/share/opensearch/config/certs/internal_users.yml /usr/share/opensearch/config/opensearch-security/internal_users.yml',
                '&&',
                'bash /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh',
                '-cd /usr/share/opensearch/config/opensearch-security',
                '-icl -nhnv',
                '-cacert /usr/share/opensearch/config/certs/CAs/rootCA.pem',
                '-cert /usr/share/opensearch/config/certs/opensearch-cert.pem',
                '-key /usr/share/opensearch/config/certs/opensearch-key.pem',
                `-h localhost`,
                `-p ${port.toString()}`,
            ].join(' ')
        ]
    );
}
