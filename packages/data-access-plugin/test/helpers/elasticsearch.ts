import * as es from 'elasticsearch';
import { ACLManager } from '@terascope/data-access';
import { ELASTICSEARCH_HOST } from './config';

// automatically set the timeout to 10s when using elasticsearch
jest.setTimeout(10000);

export function makeClient(): es.Client {
    return new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error',
        apiVersion: '6.5'
    });
}

type Model = { store: any };

export function cleanupIndex(model: Model) {
    const { client, indexQuery } = model.store;

    return client.indices.delete({
        index: indexQuery,
        requestTimeout: 3000,
        ignoreUnavailable: true,
    }).catch(() => {});
}

function format(arr: any[], index: string) {
    const results: any[] = [];
    arr.forEach((data) => {
        results.push({ index: { _index: index, _type: 'events' } }, data);
    });
    return results;
}

export async function populateIndex(client: es.Client, index: string, properties: any, data: any[]) {
    await client.indices.create({
        index,
        waitForActiveShards: 'all',
        body: {
            settings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0
            },
            mappings: {
                events: {
                    _all: {
                        enabled: false
                    },
                    dynamic: false,
                    properties
                }
            },
        }
    });

    return client.bulk({ index, type: 'events', body: format(data, index), refresh: true });
}

export function deleteIndices(client: es.Client, list: string[]) {
    return Promise.all(list.map(index => client.indices.delete({ index, requestTimeout: 1000, ignoreUnavailable: true, })));
}

export function cleanupIndexes(manager: ACLManager) {
    // @ts-ignore
    const models = [manager._roles, manager._spaces, manager._users, manager._views, manager._dataTypes];
    return Promise.all(models.map(cleanupIndex));
}
