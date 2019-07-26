import got from 'got';
import semver from 'semver';
import debug from './debug';
import { TestOptions } from './interfaces';
import { cliError } from '../misc';
import { TestSuite } from '../interfaces';

export async function ensureServices(suite: TestSuite, options: TestOptions): Promise<void> {
    const needsES = [TestSuite.Elasticsearch, TestSuite.E2E];
    const needsKafka = [TestSuite.Kafka, TestSuite.E2E];
    if (needsES.includes(suite)) {
        await ensureElasticsearch(options);
    }

    if (needsKafka.includes(suite)) {
        await ensureKafka(options);
    }
}

async function ensureElasticsearch(options: TestOptions): Promise<void> {
    const { body } = await got(options.elasticsearchUrl, {
        json: true,
        throwHttpErrors: false,
    });

    debug('got response from elasticsearch service', body);

    if (!body || !body.version || !body.version.number) {
        throw new Error(`Invalid response from elasticsearch at ${options.elasticsearchUrl}`);
    }

    const actual: string = body.version.number;
    const expected = options.serviceVersion;
    if (!expected) {
        debug(`using local version of elasticsearch v${actual}`);
        return;
    }

    const satifies = semver.satisfies(actual, `^${expected}`);
    if (satifies) {
        return;
    }

    return cliError('Error', `Elasticsearch at ${options.elasticsearchUrl} does not satify required version of ${expected}, got ${actual}`);
}

async function ensureKafka(options: TestOptions) {
    debug(`assuming ${options.kafkaBrokers.join(', ')} are up... FIXME`);
    return;
}
