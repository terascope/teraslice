import { Client } from 'elasticsearch';
import { IndexStore, createClient } from '../../src';
import { ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION } from './config';

// automatically set the timeout to 10s when using elasticsearch
jest.setTimeout(30000);

export async function makeClient() {
    if (process.env.LEGACY_CLIENT != null) {
        return new Client({
            host: ELASTICSEARCH_HOST,
            log: 'error',
            apiVersion: ELASTICSEARCH_API_VERSION,
        });
    }

    const { client } = await createClient({
        node: ELASTICSEARCH_HOST
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
            console.log('what is this', errType.statusCode, typeof errType.statusCode, err);
            if (errType.statusCode !== 404) {
                console.log('should not be herre');
                throw err;
            }
            console.log(`should be ok: ${index}`, err);
        });

    if (template) {
        await client.indices
            .deleteTemplate({
                name: template,
                requestTimeout: 3000,
            })
            .catch((_err) => {
                console.log('second err', _err);
            });
    }
}

export function cleanupIndexStore(
    store: IndexStore<any>
): Promise<void> {
    return cleanupIndex(store.client, store.searchIndex);
}
