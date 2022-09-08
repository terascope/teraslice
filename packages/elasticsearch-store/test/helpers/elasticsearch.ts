import { Client as RawClient } from 'elasticsearch';
import {
    DataEntity, pDelay, get, toNumber
} from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { IndexStore, createClient, Client } from '../../src';
import {
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_API_VERSION,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION
} from './config';

const semver = ELASTICSEARCH_VERSION.split('.').map(toNumber);
const isOpensearchTest = process.env.TEST_OPENSEARCH != null;
export const removeTypeTest = isOpensearchTest || (semver[0] === 8);
// automatically set the timeout to 10s when using elasticsearch
jest.setTimeout(30000);

export async function makeClient(): Promise<Client> {
    let host = ELASTICSEARCH_HOST;

    if (process.env.TEST_OPENSEARCH) {
        host = OPENSEARCH_HOST;
    }

    if (process.env.LEGACY_CLIENT != null) {
        return new RawClient({
            host,
            log: 'error',
            apiVersion: ELASTICSEARCH_API_VERSION,
        }) as unknown as Client;
    }

    const { client } = await createClient({
        node: host,
    });

    return client as unknown as Client;
}

export async function cleanupIndex(
    client: any, index: string, template?: string
): Promise<void> {
    await client.indices
        .delete({ index })
        .catch((err: any) => {
            // ignore index not found exceptions
            const errType = err.meta ? err.meta : err;
            if (errType.statusCode !== 404) {
                throw err;
            }
        });

    if (template) {
        await client.indices
            .deleteTemplate({
                name: template,
            })
            .catch((err: any) => {
                const errType = err.meta ? err.meta : err;
                if (errType.statusCode !== 404) {
                    throw err;
                }
            });
    }
}

export async function upload(
    client: any, queryBody: any, data: any[]
): Promise<Record<string, any>> {
    const { type, ...safeQueryBody } = queryBody;
    const body = formatUploadData(
        safeQueryBody.index as string, data
    );

    const query = Object.assign({ refresh: 'wait_for', body }, safeQueryBody);

    return client.bulk(query);
}

export function formatUploadData(
    index: string, data: any[]
): Record<string, any>[] {
    const results: any[] = [];

    data.forEach((record) => {
        const meta: any = { _index: index };

        if (!removeTypeTest) {
            meta._type = '_doc';
        }

        if (DataEntity.isDataEntity(record) && record.getKey()) {
            meta._id = record.getKey();
        }

        results.push({ index: meta }, record);
    });

    return results;
}

export function cleanupIndexStore(
    store: IndexStore<any>
): Promise<void> {
    return cleanupIndex(store.client, store.searchIndex);
}

export async function waitForData(
    client: any, index: string, count: number, timeout = 5000
): Promise<void> {
    const failTestTime = Date.now() + timeout;

    return new Promise((resolve, reject) => {
        async function checkIndex() {
            if (failTestTime <= Date.now()) reject(new Error('Could not find count in alloated time'));
            await pDelay(100);
            try {
                const response = await client.count({ index, q: '*' });
                const responseCount = get(response, 'body.count', response.count);

                if (count === responseCount) return resolve();
            } catch (err) {
                return reject(err);
            }

            checkIndex();
        }

        checkIndex();
    });
}

export function getDistributionAndVersion() {
    if (process.env.TEST_OPENSEARCH != null) {
        return {
            host: OPENSEARCH_HOST,
            distribution: ElasticsearchDistribution.opensearch,
            version: OPENSEARCH_VERSION
        };
    }

    return {
        host: ELASTICSEARCH_HOST,
        distribution: ElasticsearchDistribution.elasticsearch,
        version: ELASTICSEARCH_VERSION
    };
}

export function getTotalFormat(distribution: string, majorVersion: number, n: number) {
    if (distribution === 'opensearch' || (distribution === 'elasticsearch' && majorVersion >= 7)) {
        return { value: n, relation: 'eq' };
    }

    return n;
}
