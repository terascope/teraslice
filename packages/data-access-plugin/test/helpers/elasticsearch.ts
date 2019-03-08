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
    }).catch(() => {});
}

export function cleanupIndexes(manager: ACLManager) {
    // @ts-ignore
    const models = [manager.roles, manager.spaces, manager.users, manager.views];
    return Promise.all(models.map(cleanupIndex));
}
