import { ElasticsearchTestHelpers } from '@terascope/opensearch-client';
import { IndexStore } from '../../src/index-store.js';

export function cleanupIndexStore(
    store: IndexStore<any>
): Promise<void> {
    return ElasticsearchTestHelpers.cleanupIndex(store.client, store.searchIndex);
}
