import * as es from 'elasticsearch';
import { ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION } from './config';
import { ACLManager } from '../../src';

// automatically set the timeout to 10s when using elasticsearch
jest.setTimeout(10000);

export function makeClient(): es.Client {
    return new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error',
        apiVersion: ELASTICSEARCH_API_VERSION,
    });
}

type Model = { store: any };

export function cleanupIndex(model: Model) {
    const { client, indexQuery } = model.store;

    return client.indices
        .delete({
            index: indexQuery,
            requestTimeout: 3000,
        })
        .catch(() => {});
}

export function cleanupIndexes(manager: ACLManager) {
    // @ts-ignore
    // eslint-disable-next-line
    const models = [manager._roles, manager._spaces, manager._users, manager._views, manager._dataTypes];
    return Promise.all(models.map(cleanupIndex));
}
