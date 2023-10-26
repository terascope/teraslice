import ms from 'ms';
import got from 'got';
import semver from 'semver';
import fs from 'fs-extra';
import path from 'path';
import * as ts from '@terascope/utils';
import { getServicesForSuite, getRootDir } from '../misc';
import {
    dockerRun,
    DockerRunOptions,
    getContainerInfo,
    dockerStop,
    dockerPull,
    // kindLoadServiceImage,
    kindStartService,
    kindStopService
} from '../scripts';
import { TestOptions } from './interfaces';
import { Service } from '../interfaces';
import * as config from '../config';
import signale from '../signale';

const logger = ts.debugLogger('ts-scripts:cmd:test');

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
        mount: `type=bind,source=${restrainedElasticsearchConfigPath},target=/usr/share/elasticsearch/config/elasticsearch.yml`,
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
            ES_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
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
        ports: [`${config.OPENSEARCH_PORT}:${config.OPENSEARCH_PORT}`],
        env: {
            ES_JAVA_OPTS: config.SERVICE_HEAP_OPTS,
            'network.host': '0.0.0.0',
            'http.port': config.OPENSEARCH_PORT,
            'discovery.type': 'single-node',
            DISABLE_INSTALL_DEMO_CONFIG: 'true',
            DISABLE_SECURITY_PLUGIN: 'true'
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
            KAFKA_HEAP_OPTS: config.SERVICE_HEAP_OPTS,
            KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true',
            KAFKA_ADVERTISED_HOST_NAME: config.HOST_IP,
            KAFKA_ADVERTISED_PORT: config.KAFKA_PORT,
            KAFKA_PORT: config.KAFKA_PORT,
            KAFKA_NUM_PARTITIONS: '2',
        },
        network: config.DOCKER_NETWORK_NAME
    },
    [Service.Minio]: {
        image: config.MINIO_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.MINIO_NAME}`,
        tmpfs: config.SERVICES_USE_TMPFS
            ? ['/data']
            : undefined,
        ports: [`${config.MINIO_PORT}:${config.MINIO_PORT}`],
        env: {
            MINIO_ACCESS_KEY: config.MINIO_ACCESS_KEY,
            MINIO_SECRET_KEY: config.MINIO_SECRET_KEY,
        },
        network: config.DOCKER_NETWORK_NAME,
        args: ['server', '--address', `0.0.0.0:${config.MINIO_PORT}`, '/data']
    },
    [Service.RabbitMQ]: {
        image: config.RABBITMQ_DOCKER_IMAGE,
        name: `${config.TEST_NAMESPACE}_${config.RABBITMQ_NAME}`,
        ports: [`${config.RABBITMQ_MANAGEMENT_PORT}:15672`, `${config.RABBITMQ_PORT}:5672`],
        mount: `type=bind,source=${rabbitConfigPath},target=/etc/rabbitmq/rabbitmq.conf`,
        env: {
            RABBITMQ_HOSTNAME: '0.0.0.0',
            RABBITMQ_USER: config.RABBITMQ_USER,
            RABBITMQ_PASSWORD: config.RABBITMQ_PASSWORD,
        },
        network: config.DOCKER_NETWORK_NAME,
    }
};

export async function pullServices(suite: string, options: TestOptions): Promise<void> {
    const launchServices = getServicesForSuite(suite);

    try {
        const images: string[] = [];

        if (launchServices.includes(Service.Elasticsearch)) {
            const image = `${config.ELASTICSEARCH_DOCKER_IMAGE}:${options.elasticsearchVersion}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Opensearch)) {
            const image = `${config.OPENSEARCH_DOCKER_IMAGE}:${options.opensearchVersion}`;
            images.push(image);
        }

        if (launchServices.includes(Service.RestrainedOpensearch)) {
            const image = `${config.OPENSEARCH_DOCKER_IMAGE}:${options.opensearchVersion}`;
            images.push(image);
        }

        if (launchServices.includes(Service.RestrainedElasticsearch)) {
            const image = `${config.ELASTICSEARCH_DOCKER_IMAGE}:${options.elasticsearchVersion}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Kafka)) {
            const image = `${config.KAFKA_DOCKER_IMAGE}:${options.kafkaVersion}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Minio)) {
            const image = `${config.MINIO_DOCKER_IMAGE}:${options.minioVersion}`;
            images.push(image);
        }

        if (launchServices.includes(Service.RabbitMQ)) {
            const image = `${config.RABBITMQ_DOCKER_IMAGE}`;
            images.push(image);
        }

        await Promise.all(images.map(async (image) => {
            const label = `docker pull ${image}`;
            signale.time(label);
            await dockerPull(image);
            signale.timeEnd(label);
        }));
    } catch (err) {
        throw new ts.TSError(err, {
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

async function stopService(service: Service) {
    const { name } = services[service];
    const info = await getContainerInfo(name);
    if (!info) return;

    const startTime = Date.now();
    signale.pending(`stopping service ${service}`);
    await dockerStop(name);
    signale.success(`stopped service ${service}, took ${ts.toHumanTime(Date.now() - startTime)}`);
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
    await ts.pWhile(
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
                    retry: 0,
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
            const expected = options.opensearchVersion;

            if (semver.satisfies(actual, `^${expected}`)) {
                const took = ts.toHumanTime(Date.now() - startTime);
                signale.success(`restrained opensearch@${actual} is running at ${host}, took ${took}`);
                return true;
            }

            throw new ts.TSError(
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
    await ts.pWhile(
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
                    retry: 0,
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
            const expected = options.opensearchVersion;

            if (semver.satisfies(actual, `^${expected}`)) {
                const took = ts.toHumanTime(Date.now() - startTime);
                signale.success(`opensearch@${actual} is running at ${host}, took ${took}`);
                return true;
            }

            throw new ts.TSError(
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
    await ts.pWhile(
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
                    retry: 0,
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
            const expected = options.elasticsearchVersion;

            if (semver.satisfies(actual, `^${expected}`)) {
                const took = ts.toHumanTime(Date.now() - startTime);
                signale.success(`elasticsearch@${actual} is running at ${host}, took ${took}`);
                return true;
            }

            throw new ts.TSError(
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
    await ts.pWhile(
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
                    retry: 0,
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
            const expected = options.elasticsearchVersion;

            if (semver.satisfies(actual, `^${expected}`)) {
                const took = ts.toHumanTime(Date.now() - startTime);
                signale.success(`elasticsearch@${actual} is running at ${host}, took ${took}`);
                return true;
            }

            throw new ts.TSError(
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
    await ts.pWhile(
        async () => {
            if (options.trace) {
                signale.debug(`checking MinIO at ${host}`);
            } else {
                logger.debug(`checking MinIO at ${host}`);
            }

            let statusCode: number;
            try {
                ({ statusCode } = await got('minio/health/live', {
                    prefixUrl: host,
                    responseType: 'json',
                    throwHttpErrors: false,
                    retry: 0,
                }));
            } catch (err) {
                error = err.message;
                statusCode = ts.getErrorStatusCode(err);
            }

            if (options.trace) {
                signale.debug('got response from MinIO service', { statusCode });
            } else {
                logger.debug('got response from MinIO service', { statusCode });
            }

            if (statusCode === 200) {
                const took = ts.toHumanTime(Date.now() - startTime);
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
    await ts.pWhile(
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
                    retry: 0,
                    username: config.RABBITMQ_USER,
                    password: config.RABBITMQ_PASSWORD
                }));
            } catch (err) {
                error = err.message;
                statusCode = ts.getErrorStatusCode(err);
            }

            if (options.trace) {
                signale.debug('got response from RabbitMQ service', { statusCode });
            } else {
                logger.debug('got response from RabbitMQ service', { statusCode });
            }

            if (statusCode === 200) {
                const took = ts.toHumanTime(Date.now() - startTime);
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
    const took = ts.toHumanTime(Date.now() - startTime);
    signale.success(`kafka@${options.kafkaVersion} *might* be running at ${config.KAFKA_BROKER}, took ${took}`);
}

async function startService(options: TestOptions, service: Service): Promise<() => void> {
    let serviceName = service;

    if (serviceName === 'restrained_elasticsearch') {
        serviceName = Service.Elasticsearch;
    }

    if (serviceName === 'restrained_opensearch') {
        serviceName = Service.Opensearch;
    }

    const version = options[`${serviceName}Version`] as string;
    if (options.useExistingServices) {
        signale.warn(`expecting ${service}@${version} to be running (this can be dangerous)...`);
        return () => { };
    }

    signale.pending(`starting ${service}@${version} service...`);

    if (options.testPlatform === 'kubernetes') {
        await kindStopService(service);
        // await kindLoadServiceImage(service);
        await kindStartService(service);
        return () => { };
    }

    await stopService(service);

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
                new ts.TSError(err, {
                    reason: `Failed to stop ${service}@${version} service`,
                })
            );
        }
    };
}
