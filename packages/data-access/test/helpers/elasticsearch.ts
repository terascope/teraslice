import * as es from 'elasticsearch';
import { ELASTICSEARCH_HOST } from './config';

export function makeClient(): es.Client {
    return new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error'
    });
}

export function cleanupIndex(model: { store: any }) {
    const { client, indexQuery } = model.store;

    return client.indices.delete({
        index: indexQuery,
    }).catch(() => {});
}
