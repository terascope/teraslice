import ms from 'ms';
import got from 'got';
import semver from 'semver';
import * as ts from '@terascope/utils';
import { getErrorStatusCode } from '@terascope/utils';
import { getServicesForSuite } from '../misc';
import {
    dockerRun,
    DockerRunOptions,
    getContainerInfo,
    dockerStop,
    dockerPull
} from '../scripts';
import { TestOptions } from './interfaces';
import { Service } from '../interfaces';
import * as config from '../config';
import signale from '../signale';

const logger = ts.debugLogger('ts-scripts:cmd:test');

const serviceUpTimeout = ms('2m');

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

        if (launchServices.includes(Service.Kafka)) {
            const image = `${config.KAFKA_DOCKER_IMAGE}:${options.kafkaVersion}`;
            images.push(image);
        }

        if (launchServices.includes(Service.Minio)) {
            const image = `${config.MINIO_DOCKER_IMAGE}:${options.minioVersion}`;
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
            message: `Failed to pull services for test suite "${suite}"`,
        });
    }
}

export async function ensureServices(suite: string, options: TestOptions): Promise<() => void> {
    const launchServices = getServicesForSuite(suite);

    const promises: Promise<(() => void)>[] = [];

    if (launchServices.includes(Service.Elasticsearch)) {
        promises.push(ensureElasticsearch(options));
    }

    if (launchServices.includes(Service.Kafka)) {
        promises.push(ensureKafka(options));
    }

    if (launchServices.includes(Service.Minio)) {
        promises.push(ensureMinio(options));
    }

    const fns = await Promise.all(promises);

    return () => {
        fns.forEach((fn) => fn());
    };
}

export async function ensureKafka(options: TestOptions): Promise<() => void> {
    let fn = () => {};
    const startTime = Date.now();
    fn = await startService(options, Service.Kafka);
    await checkKafka(options, startTime);
    return fn;
}

export async function ensureMinio(options: TestOptions): Promise<() => void> {
    let fn = () => {};
    const startTime = Date.now();
    fn = await startService(options, Service.Minio);
    await checkMinio(options, startTime);
    return fn;
}

export async function ensureElasticsearch(options: TestOptions): Promise<() => void> {
    let fn = () => {};
    const startTime = Date.now();
    fn = await startService(options, Service.Elasticsearch);
    await checkElasticsearch(options, startTime);
    return fn;
}

async function stopService(service: Service) {
    const { name } = services[service];
    const info = await getContainerInfo(name);
    if (!info) return;

    const startTime = Date.now();
    signale.pending(`stopping service ${service}`);
    await dockerStop(name);
    signale.success(`stopped service ${service}, took ${ms(Date.now() - startTime)}`);
}

async function checkElasticsearch(options: TestOptions, startTime: number): Promise<void> {
    const host = config.ELASTICSEARCH_HOST;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.ELASTICSEARCH_HOSTNAME)) return;

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

            const satifies = semver.satisfies(actual, `^${expected}`);
            if (satifies) {
                const took = ms(Date.now() - startTime);
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
        }
    );
}

async function checkMinio(options: TestOptions, startTime: number): Promise<void> {
    const host = config.MINIO_HOST;

    const dockerGateways = ['host.docker.internal', 'gateway.docker.internal'];
    if (dockerGateways.includes(config.MINIO_HOSTNAME)) return;

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
                statusCode = getErrorStatusCode(err);
            }

            if (options.trace) {
                signale.debug('got response from MinIO service', { statusCode });
            } else {
                logger.debug('got response from MinIO service', { statusCode });
            }

            if (statusCode === 200) {
                const took = ms(Date.now() - startTime);
                signale.success(`MinIO is running at ${host}, took ${took}`);
                return true;
            }
            return false;
        },
        {
            name: `MinIO service (${host})`,
            timeoutMs: serviceUpTimeout,
            enabledJitter: true,
        }
    );
}

async function checkKafka(options: TestOptions, startTime: number) {
    const took = ms(Date.now() - startTime);
    signale.success(`kafka@${options.kafkaVersion} *might* be running at ${config.KAFKA_BROKER}, took ${took}`);
}

async function startService(options: TestOptions, service: Service): Promise<() => void> {
    const version = options[`${service}Version`] as string;
    if (options.useExistingServices) {
        signale.warn(`expecting ${service}@${version} to be running (this can be dangerous)...`);
        return () => {};
    }

    signale.pending(`starting ${service}@${version} service...`);

    await stopService(service);

    const fn = await dockerRun(services[service], version, options.debug || options.trace);

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
