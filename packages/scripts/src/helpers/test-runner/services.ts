import got from 'got';
import semver from 'semver';
import { debugLogger, pRetry, TSError } from '@terascope/utils';
import { TestOptions } from './interfaces';
import { TestSuite } from '../interfaces';
import { dockerRun, DockerRunOptions, getContainerInfo, dockerStop, pgrep } from '../scripts';
import signale from '../signale';

const logger = debugLogger('ts-scripts:cmd:test');

type Service = TestSuite.Elasticsearch | TestSuite.Kafka;
const services: { [service in Service]: DockerRunOptions } = {
    [TestSuite.Elasticsearch]: {
        image: 'blacktop/elasticsearch',
        name: 'ts_test_elasticsearch',
        tmpfs: ['/usr/share/elasticsearch/data'],
        ports: [9200],
        env: {
            ES_JAVA_OPTS: '-Xms256m -Xmx256m',
            'network.host': '0.0.0.0',
            'discovery.type': 'single-node',
        },
    },
    [TestSuite.Kafka]: {
        image: 'terascope/kafka-zookeeper',
        name: 'ts_test_kafka',
        tmpfs: ['/kafka', '/zookeeper'],
        ports: [2181, 9092],
        env: {
            KAFKA_HEAP_OPTS: '-Xms256m -Xmx256m',
        },
    },
};

export async function ensureServices(suite: TestSuite, options: TestOptions): Promise<() => void> {
    const needsES = [TestSuite.Elasticsearch, TestSuite.E2E];
    const needsKafka = [TestSuite.Kafka, TestSuite.E2E];
    const cleanupFns: (() => void)[] = [];

    if (needsES.includes(suite)) {
        try {
            await checkElasticsearch(options, 2);
        } catch (err) {
            cleanupFns.push(await startService(options, TestSuite.Elasticsearch));
            await checkElasticsearch(options, 10);
        }
    }

    if (needsKafka.includes(suite)) {
        try {
            await checkKafka(options);
        } catch (err) {
            cleanupFns.push(await startService(options, TestSuite.Kafka));
            await checkKafka(options);
        }
    }

    return () => {
        cleanupFns.forEach(fn => fn());
    };
}

export async function stopAllServices(): Promise<void> {
    const promises = Object.keys(services).map(service => stopService(service as Service));

    await Promise.all(promises);
}

async function stopService(service: Service) {
    const { name } = services[service];
    const info = await getContainerInfo(name);
    if (!info) return;

    signale.await(`stopping service ${service}`);
    await dockerStop(name);
    signale.success(`stopped service ${service}`);
}

async function checkElasticsearch(options: TestOptions, retries: number): Promise<void> {
    return pRetry(
        async () => {
            logger.debug(`checking elasticsearch at ${options.elasticsearchUrl}`);

            let body: any;
            try {
                ({ body } = await got(options.elasticsearchUrl, {
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
                throw new TSError(`Invalid response from elasticsearch at ${options.elasticsearchUrl}`, {
                    retryable: true,
                });
            }

            const actual: string = body.version.number;
            const expected = options.elasticsearchVersion;
            if (!expected) {
                logger.debug(`using local version of elasticsearch v${actual}`);
                return;
            }

            const satifies = semver.satisfies(actual, `^${expected}`);
            if (satifies) {
                return;
            }

            throw new TSError(
                `Elasticsearch at ${options.elasticsearchUrl} does not satify required version of ${expected}, got ${actual}`,
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
    signale.await(`starting ${service}@${version} service`);
    await stopService(service);
    const fn = await dockerRun(services[service], version);
    signale.success(`started ${service}@${version} service`);
    return fn;
}

async function checkKafka(options: TestOptions) {
    const p = await pgrep('kafka');
    if (!p) {
        throw new Error('Kafka is not running');
    }

    signale.debug(`assuming kafka brokers at ${options.kafkaBrokers.join(', ')} are up...`, p);
    return;
}
