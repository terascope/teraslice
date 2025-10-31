import ms from 'ms';
import got from 'got';
import semver from 'semver';
import fs from 'fs-extra';
import path from 'node:path';
import yaml from 'js-yaml';
import { Kafka } from 'kafkajs';
import {
    pWhile, TSError, debugLogger,
    getErrorStatusCode, isKey, toHumanTime
} from '@terascope/core-utils';
import { getServicesForSuite, getRootDir } from '../misc.js';
import {
    dockerRun, DockerRunOptions, getContainerInfo,
    dockerStop, k8sStartService, k8sStopService,
    loadThenDeleteImageFromCache, dockerPull, logTCPPorts
} from '../scripts.js';
import { Kind } from '../kind.js';
import { TestOptions } from './interfaces.js';
import { Service } from '../interfaces.js';
import * as config from '../config.js';
import signale from '../signale.js';

const logger = debugLogger('ts-scripts:cmd:test');

const serviceUpTimeout = ms(config.SERVICE_UP_TIMEOUT);

const rabbitConfigPath = path.join(getRootDir(), '/.ts-test-config/rabbitmq.conf');
const restrainedElasticsearchConfigPath = path.join(getRootDir(), '/.ts-test-config/elasticsearch.yml');

const disableXPackSecurity = !config.ELASTICSEARCH_DOCKER_IMAGE.includes('blacktop');

const services: Readonly<Record<Service, Readonly<DockerRunOptions>>> = {
    [Service.Elasticsearch]: {
        image: config.ELASTICSEARCH_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.ELASTICSEARCH_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/usr/share/elasticsearch/data']
            : undefined,
        ports: [`${config.ELASTICSEARCH_PORT}:${config.ELASTICSEARCH_PORT}`],
        env: {
            ES_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.ELASTICSEARCH_PORT,
            'discovery.type': 'single-node',
            ...disableXPackSecurity && {
                'xpack.security.enabled': 'false'
            }
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.RestrainedElasticsearch]: {
        image: config.ELASTICSEARCH_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.ELASTICSEARCH_NAME}`,
        mount: [`type=bind,source=${restrainedElasticsearchConfigPath},target=/usr/share/elasticsearch/config/elasticsearch.yml`],
        ports: [`${config.RESTRAINED_ELASTICSEARCH_PORT}:${config.RESTRAINED_ELASTICSEARCH_PORT}`],
        env: {
            ES_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.RESTRAINED_ELASTICSEARCH_PORT,
            'discovery.type': 'single-node',
            ...disableXPackSecurity && {
                'xpack.security.enabled': 'false'
            }
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.RestrainedOpensearch]: {
        image: config.OPENSEARCH_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.OPENSEARCH_NAME}`,
        ports: [`${config.RESTRAINED_OPENSEARCH_PORT}:${config.RESTRAINED_OPENSEARCH_PORT}`],
        env: {
            OPENSEARCH_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.RESTRAINED_OPENSEARCH_PORT,
            'discovery.type': 'single-node',
            DISABLE_INSTALL_DEMO_CONFIG: 'true',
            DISABLE_SECURITY_PLUGIN: 'true'
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.Opensearch]: {
        image: config.OPENSEARCH_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.OPENSEARCH_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/usr/share/opensearch/data:uid=1000,gid=1000']
            : undefined,
        ports: [`${config.OPENSEARCH_PORT}:${config.OPENSEARCH_PORT}`],
        env: {
            OPENSEARCH_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.OPENSEARCH_PORT,
            'discovery.type': 'single-node',
            DISABLE_INSTALL_DEMO_CONFIG: 'true',
            DISABLE_SECURITY_PLUGIN: 'true',
            DISABLE_PERFORMANCE_ANALYZER_AGENT_CLI: 'true'
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.Kafka]: {
        image: config.KAFKA_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.KAFKA_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/tmp/kafka-logs']
            : undefined,
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
            KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: config.KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS
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
            ? [`type=bind,source=${path.join(getRootDir(), '/e2e/test/certs')},target=/opt/certs`]
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
    }
};

export async function loadOrPullServiceImages(
    suite: string,
    skipImageDeletion: boolean
): Promise<void> {
    const launchServices = getServicesForSuite(suite);

    try {
        const images: string[] = [];
        const loadFailedList: string[] = [];

        if (launchServices.includes(Service.Elasticsearch)) {
            const image = `${config.ELASTICSEARCH_DOCKER_IMAGE}:${config.ELASTICSEARCH_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Opensearch)) {
            const image = `${config.OPENSEARCH_DOCKER_IMAGE}:${config.OPENSEARCH_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.RestrainedOpensearch)) {
            const image = `${config.OPENSEARCH_DOCKER_IMAGE}:${config.OPENSEARCH_VERSION}`;
            images.push(image);
        }

        if (launchServices.includes(Service.RestrainedElasticsearch)) {
            const image = `${config.ELASTICSEARCH_DOCKER_IMAGE}:${config.ELASTICSEARCH_VERSION}`;
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

export async function ensureServices(suite: string, options: TestOptions): Promise<() => void> {
    const launchServices = getServicesForSuite(suite);
    const promises: Promise<(() => void)>[] = [];

    if (launchServices.includes(Service.Elasticsearch)) {
        promises.push(ensureElasticsearch(options));
    }

    if (launchServices.includes(Service.RestrainedElasticsearch)) {
        // we create the elasticsearch.yml file for tests
        if (!options.ignoreMount) {
            await fs.outputFile(restrainedElasticsearchConfigPath, 'network.host: 0.0.0.0\nthread_pool.write.queue_size: 2');
        }
        promises.push(ensureRestrainedElasticsearch(options));
    }

    if (launchServices.includes(Service.RestrainedOpensearch)) {
        // we create the elasticsearch.yml file for tests
        if (!options.ignoreMount) {
            await fs.outputFile(restrainedElasticsearchConfigPath, 'network.host: 0.0.0.0\nthread_pool.write.queue_size: 2');
        }
        promises.push(ensureRestrainedOpensearch(options));
    }

    if (launchServices.includes(Service.Opensearch)) {
        promises.push(ensureOpensearch(options));
    }

    if (launchServices.includes(Service.Kafka)) {
        promises.push(ensureKafka(options));
    }

    if (launchServices.includes(Service.Minio)) {
        promises.push(ensureMinio(options));
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

    const fns = await Promise.all(promises);

    return () => {
        fns.forEach((fn) => fn());
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

export async function ensureElasticsearch(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.Elasticsearch);
    await checkElasticsearch(options, startTime);
    return fn;
}

export async function ensureRestrainedElasticsearch(options: TestOptions): Promise<() => void> {
    let fn = () => { };
    const startTime = Date.now();
    fn = await startService(options, Service.RestrainedElasticsearch);
    await checkRestrainedElasticsearch(options, startTime);
    return fn;
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

async function stopService(service: Service) {
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

async function checkOpensearch(options: TestOptions, startTime: number): Promise<void> {
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
                signale.debug('got response from opensearch service', body);
            } else {
                logger.debug('got response from opensearch service', body);
            }

            if (!body?.version?.number) {
                return false;
            }

            const actual: string = body.version.number;
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
        },
        {
            name: `Opensearch service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function checkRestrainedElasticsearch(
    options: TestOptions, startTime: number
): Promise<void> {
    const host = config.RESTRAINED_ELASTICSEARCH_HOST;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.ELASTICSEARCH_HOSTNAME)) return;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking restrained elasticsearch at ${host}`);
            } else {
                logger.debug(`checking restrained elasticsearch at ${host}`);
            }

            let body: any;
            try {
                ({ body } = await got(host, {
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
                signale.debug('got response from restrained elasticsearch service', body);
            } else {
                logger.debug('got response from restrained elasticsearch service', body);
            }

            if (!body?.version?.number) {
                return false;
            }

            const actual: string = body.version.number;
            const expected = config.ELASTICSEARCH_VERSION;

            if (semver.satisfies(actual, `~${expected}`)) {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`elasticsearch@${actual} is running at ${host}, took ${took}`);
                return true;
            }

            throw new TSError(
                `Restrained Elasticsearch at ${host} does not satisfy required version of ${expected}, got ${actual}`,
                {
                    retryable: false,
                }
            );
        },
        {
            name: `Restrained Elasticsearch service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
            error
        }
    );
}

async function checkElasticsearch(options: TestOptions, startTime: number): Promise<void> {
    const host = config.ELASTICSEARCH_HOST;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.ELASTICSEARCH_HOSTNAME)) return;

    let error = '';
    await pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking elasticsearch at ${host}`);
            } else {
                logger.debug(`checking elasticsearch at ${host}`);
            }

            let body: any;
            try {
                ({ body } = await got(host, {
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
                signale.debug('got response from elasticsearch service', body);
            } else {
                logger.debug('got response from elasticsearch service', body);
            }

            if (!body?.version?.number) {
                return false;
            }

            const actual: string = body.version.number;
            const expected = config.ELASTICSEARCH_VERSION;

            if (semver.satisfies(actual, `~${expected}`)) {
                const took = toHumanTime(Date.now() - startTime);
                signale.success(`elasticsearch@${actual} is running at ${host}, took ${took}`);
                return true;
            }

            throw new TSError(
                `Elasticsearch at ${host} does not satisfy required version of ${expected}, got ${actual}`,
                {
                    retryable: false,
                }
            );
        },
        {
            name: `Elasticsearch service (${host})`,
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
            const rootCaPath = path.join(getRootDir(), 'e2e/test/certs/CAs/rootCA.pem');
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

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.KAFKA_HOSTNAME)) return;

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
        }
    });
    const producer = kafka.producer();
    const took = toHumanTime(Date.now() - startTime);
    try {
        await producer.connect();
    } catch (err) {
        if (err.message.includes('ENOTFOUND') && err.message.includes(config.KAFKA_BROKER)) {
            throw new Error(`Unable to connect to kafka broker after ${totalTime}ms at ${kafkaBroker}`);
        } else if (err.message.includes('ECONNREFUSED') && err.message.includes(config.KAFKA_BROKER)) {
            throw new Error(`Unable to connect to kafka broker after ${totalTime}ms at ${kafkaBroker}`);
        }
        throw new Error(err.message);
    }
    signale.success(`kafka@${config.KAFKA_VERSION} is running at ${config.KAFKA_BROKER}, took ${took}`);
}

async function checkUtility(options: TestOptions, startTime: number): Promise<void> {
    const took = toHumanTime(Date.now() - startTime);
    signale.success(`Utility Service **might** be running, took ${took}`);
}

async function startService(options: TestOptions, service: Service): Promise<() => void> {
    let serviceName = service;

    if (serviceName === 'restrained_elasticsearch') {
        serviceName = Service.Elasticsearch;
    }

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

    if (options.clusteringType === 'kubernetesV2') {
        const kind = new Kind(config.K8S_VERSION, options.kindClusterName);
        await kind.loadServiceImage(
            service,
            services[service].image,
            version,
            options.skipImageDeletion
        );
        await k8sStopService(service);
        await logTCPPorts(serviceName);
        await k8sStartService(service, services[service].image, version, kind);
        return () => { };
    }

    await stopService(service);

    await logTCPPorts(serviceName);

    const fn = await dockerRun(
        services[service],
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
        } else if (service === Service.Elasticsearch) {
            promiseArray.push(kind.loadServiceImage(
                service,
                config.ELASTICSEARCH_DOCKER_IMAGE,
                config.ELASTICSEARCH_VERSION,
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
        }
    });
    await Promise.all(promiseArray);
}

export async function loadImagesForHelmFromConfigFile(
    kindClusterName: string,
    configFilePath: string
) {
    const kind = new Kind(config.K8S_VERSION, kindClusterName);
    const customConfig = yaml.load(fs.readFileSync(configFilePath, 'utf8')) as any;
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
            // Handle all elasticsearch options
            } else if (service.includes(Service.Elasticsearch)) {
                promiseArray.push(kind.loadServiceImage(
                    Service.Elasticsearch,
                    config.ELASTICSEARCH_DOCKER_IMAGE,
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
            }
        }
    }
    await Promise.all(promiseArray);
}
