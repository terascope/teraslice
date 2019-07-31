import ms from 'ms';
import got from 'got';
import isCI from 'is-ci';
import semver from 'semver';
import { debugLogger, pRetry, TSError } from '@terascope/utils';
import { dockerRun, DockerRunOptions, getContainerInfo, dockerStop, pgrep, ensureDockerNetwork } from '../scripts';
import { TestOptions } from './interfaces';
import { TestSuite } from '../interfaces';
import signale from '../signale';

const logger = debugLogger('ts-scripts:cmd:test');

const network = 'ts_test';

type Service = TestSuite.Elasticsearch | TestSuite.Kafka;
const services: { [service in Service]: DockerRunOptions } = {
    [TestSuite.Elasticsearch]: {
        image: 'blacktop/elasticsearch',
        name: 'ts_test_elasticsearch',
        hostname: 'elasticsearch',
        network,
        tmpfs: ['/usr/share/elasticsearch/data'],
        ports: [9200],
        env: {
            ES_JAVA_OPTS: '-Xms256m -Xmx256m',
            'network.host': '0.0.0.0',
            'discovery.type': 'single-node',
        },
    },
    [TestSuite.Kafka]: {
        image: 'blacktop/kafka',
        name: 'ts_test_kafka',
        hostname: 'kafka',
        network,
        tmpfs: ['/tmp/kafka-logs'],
        ports: [2181, 9092],
        env: {
            KAFKA_HEAP_OPTS: '-Xms256m -Xmx256m',
            KAKFA_AUTO_CREATE_TOPICS_ENABLE: 'true',
            KAFKA_NUM_PARTITIONS: '2',
        },
    },
};

export async function ensureServices(suite: TestSuite, options: TestOptions): Promise<() => void> {
    try {
        if (suite === TestSuite.Elasticsearch) {
            return ensureElasticsearch(options, true);
        }

        if (suite === TestSuite.Kafka) {
            return ensureKafka(options, true);
        }

        if (suite === TestSuite.E2E) {
            await ensureDockerNetwork(network);
            const fns = await Promise.all([ensureElasticsearch(options), ensureKafka(options)]);
            return () => {
                fns.forEach(fn => fn());
            };
        }
    } catch (err) {
        throw new TSError(err, {
            message: `Failed to start services for test suite "${suite}"`,
        });
    }

    return () => {};
}

export async function ensureKafka(options: TestOptions, ensureNetwork?: boolean): Promise<() => void> {
    let fn = () => {};
    const hostname = options.suite === TestSuite.E2E ? services.kafka.hostname : 'localhost';
    services.kafka.env!.KAFKA_ADVERTISED_HOST_NAME = hostname;
    fn = await startService(options, TestSuite.Kafka);
    if (ensureNetwork) {
        await ensureDockerNetwork(network);
    }
    await checkKafka(options);
    return fn;
}

export async function ensureElasticsearch(options: TestOptions, ensureNetwork?: boolean): Promise<() => void> {
    let fn = () => {};
    let shouldStart = false;

    try {
        if (!isCI) {
            await checkElasticsearch(options, 2);
        } else {
            shouldStart = true;
        }
    } catch (err) {
        shouldStart = true;
    }

    if (shouldStart) {
        if (ensureNetwork) {
            await ensureDockerNetwork(network);
        }
        fn = await startService(options, TestSuite.Elasticsearch);
        await checkElasticsearch(options, 10);
    }
    return fn;
}

export async function stopAllServices(): Promise<void> {
    const promises = Object.keys(services).map(service => stopService(service as Service));

    await Promise.all(promises);
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

async function checkElasticsearch(options: TestOptions, retries: number): Promise<void> {
    return pRetry(
        async () => {
            logger.debug(`checking elasticsearch at ${options.elasticsearchHost}`);

            let body: any;
            try {
                ({ body } = await got(options.elasticsearchHost, {
                    json: true,
                    throwHttpErrors: true,
                    retry: 0,
                }));
            } catch (err) {
                throw new TSError(err, {
                    retryable: true,
                });
            }

            logger.debug('got response from elasticsearch service', body);

            if (!body || !body.version || !body.version.number) {
                throw new TSError(`Invalid response from elasticsearch at ${options.elasticsearchHost}`, {
                    retryable: true,
                });
            }

            const actual: string = body.version.number;
            const expected = options.elasticsearchVersion;

            const satifies = semver.satisfies(actual, `^${expected}`);
            if (satifies) {
                signale.debug(`elasticsearch@${actual} is running at ${options.elasticsearchHost}`);
                return;
            }

            throw new TSError(
                `Elasticsearch at ${options.elasticsearchHost} does not satify required version of ${expected}, got ${actual}`,
                {
                    retryable: false,
                }
            );
        },
        {
            retries,
        }
    );
}

async function startService(options: TestOptions, service: Service): Promise<() => void> {
    const version = options[`${service}Version`] as string;
    const startTime = Date.now();
    signale.pending(`starting ${service}@${version} service...`);

    await stopService(service);

    const fn = await dockerRun(services[service], version);

    signale.success(`started ${service}@${version} service, took ~${ms(Date.now() - startTime)}`);

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

async function checkKafka(options: TestOptions) {
    const p = await pgrep('kafka');
    if (!p) {
        throw new Error('Kafka is not running');
    }

    signale.debug(`kafka should be running at ${options.kafkaBroker}`);
    return;
}
