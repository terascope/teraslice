import { Client } from 'elasticsearch';
import { IndexStore, createClient } from '../../src/index.js';
import {
    ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION,
    OPENSEARCH_HOST,
} from './config';

// automatically set the timeout to 10s when using elasticsearch
jest.setTimeout(30000);

export async function makeClient() {
    let host = ELASTICSEARCH_HOST;

    if (process.env.TEST_OPENSEARCH) {
        host = OPENSEARCH_HOST;
    }

    if (process.env.LEGACY_CLIENT != null) {
        return new Client({
            host,
            log: 'error',
            apiVersion: ELASTICSEARCH_API_VERSION,
        });
    }

    const { client } = await createClient({
        node: host,
    });

    return client as unknown as Client;
}

export async function cleanupIndex(
    client: Client, index: string, template?: string
): Promise<void> {
    await client.indices
        .delete({ index })
        .catch((err) => {
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
            .catch((err) => {
                const errType = err.meta ? err.meta : err;
                if (errType.statusCode !== 404) {
                    throw err;
                }
            });
    }
}

export function cleanupIndexStore(
    store: IndexStore<any>
): Promise<void> {
    return cleanupIndex(store.client, store.searchIndex);
}
