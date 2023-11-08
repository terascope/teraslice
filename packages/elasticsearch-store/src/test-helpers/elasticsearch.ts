import { Client as RawClient } from 'elasticsearch';
import {
    DataEntity, pDelay, get, toNumber,
    uniq
} from '@terascope/utils';
import { DataType } from '@terascope/data-types';
import { ClientMetadata, ElasticsearchDistribution } from '@terascope/types';
import {
    IndexStore, createClient, Client, getClientMetadata,
    fixMappingRequest, Semver
} from '../../src';
import {
    ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION, ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST, OPENSEARCH_VERSION, RESTRAINED_OPENSEARCH_HOST
} from './config';

const semver = ELASTICSEARCH_VERSION.split('.').map(toNumber);
const isOpensearchTest = process.env.TEST_OPENSEARCH != null;
export const removeTypeTest = isOpensearchTest || (semver[0] === 8);

export async function makeClient(): Promise<Client> {
    let host = ELASTICSEARCH_HOST;

    if (process.env.TEST_OPENSEARCH) {
        host = OPENSEARCH_HOST;
    }

    if (process.env.TEST_RESTRAINED_OPENSEARCH) {
        host = RESTRAINED_OPENSEARCH_HOST;
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

export async function deleteAllRecords(client: any, index: string) {
    const deleteByQueryResponse = await client
        .deleteByQuery(
            {
                body: {
                    query: {
                        match_all: {},
                    },
                },
                index,
                refresh: 'true'
            })
        .catch((err: any) => {
            // ignore index not found exceptions
            const errType = err.meta ? err.meta : err;
            if (errType.statusCode !== 404) {
                throw err;
            }
        });

    console.log('@@@ deleteByQueryResponse: ', deleteByQueryResponse);
}

/*
 This is a quick and easy way to upload data, however, types are auto generated
 by elasticsearch itself. If you need to control types for detailed searching
 mechanisms use populateIndex
*/
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

export function createMappingFromDatatype(
    client: Client,
    dataType: DataType,
    type = '_doc',
    overrides = {}
) {
    const metaData = getClientMetadata(client);
    const mapping = dataType.toESMapping({ typeName: type, overrides, ...metaData });

    return fixMappingRequest(client, { body: mapping }, false);
}

export async function populateIndex(
    client: Client,
    index: string,
    dataType: DataType,
    records: any[],
    type = '_doc'
): Promise<void> {
    const overrides = {
        settings: {
            'index.number_of_shards': 1,
            'index.number_of_replicas': 0,
        },
    };

    const mapping = createMappingFromDatatype(
        client, dataType, type, overrides
    );

    await client.indices.create({
        index,
        waitForActiveShards: 'all',
        ...mapping
    });

    const body = formatUploadData(index, records);

    const results = await client.bulk({
        index,
        type,
        body,
        refresh: true
    });

    if (results.errors) {
        const errors: string[] = [];
        for (const response of results.items) {
            if (response?.index?.error) errors.push(response.index.error.reason);
        }

        throw new Error(`There were errors populating index, errors: ${uniq(errors).join(' ; ')}`);
    }
}

export function formatUploadData(
    index: string, data: any[], apiCompatibility = false
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
        // This format is used by elasticsearch-api and elasticsearch-assets
        if (apiCompatibility) {
            results.push({ action: { index: meta }, data: record });
        } else {
            // this is used for raw elasticsearch bulk queries
            results.push({ index: meta }, record);
        }
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
            if (failTestTime <= Date.now()) {
                reject(new Error('Could not find count in alloated time'));
            }

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

export interface TestENVClientInfo extends ClientMetadata {
    host: string
}

function parseVersion(version: string): Semver {
    const [
        majorVersion = 6,
        minorVersion = 8,
        patchVersion = 6
    ] = version.split('.').map(toNumber);

    return [majorVersion, minorVersion, patchVersion];
}

export function getTestENVClientInfo()
: TestENVClientInfo {
    if (process.env.TEST_OPENSEARCH != null) {
        const version = OPENSEARCH_VERSION;
        const [majorVersion, minorVersion] = parseVersion(version);

        return {
            host: OPENSEARCH_HOST,
            distribution: ElasticsearchDistribution.opensearch,
            version,
            majorVersion,
            minorVersion
        };
    }

    if (process.env.TEST_RESTRAINED_OPENSEARCH != null) {
        const version = OPENSEARCH_VERSION;
        const [majorVersion, minorVersion] = parseVersion(version);

        return {
            host: RESTRAINED_OPENSEARCH_HOST,
            distribution: ElasticsearchDistribution.opensearch,
            version,
            majorVersion,
            minorVersion
        };
    }
    const version = ELASTICSEARCH_VERSION;
    const [majorVersion, minorVersion] = parseVersion(version);

    return {
        host: ELASTICSEARCH_HOST,
        distribution: ElasticsearchDistribution.elasticsearch,
        version,
        majorVersion,
        minorVersion
    };
}

export function getTotalFormat(distribution: string, majorVersion: number, n: number) {
    if (distribution === 'opensearch' || (distribution === 'elasticsearch' && majorVersion >= 7)) {
        return { value: n, relation: 'eq' };
    }

    return n;
}
