import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import type { ClientMetadata } from '@terascope/types';
import type { DataType } from '@terascope/data-types';
import type { QueryAccess } from '../../src/index.js';
import { DuckTestDB } from '../sql/duckdb-helpers.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

/**
 * One engine, queried the same way as the other.
 *
 * `QueryAccess` is the entry point on both sides (`restrictSearchQuery` for OpenSearch,
 * `restrictSQLQuery` for DuckDB), and each returns something its client runs unchanged.
 * Implementations must not add clauses of their own, or the test no longer runs what a
 * caller would execute.
*/
export interface ParityEngine {
    readonly name: string;
    /** The ids of the matching records, in ascending id order. */
    search(
        access: QueryAccess<any>, query: string, variables?: Record<string, unknown>
    ): Promise<string[]>;
    close(): Promise<void>;
}

/** Engines return ids in no particular order, so the answer is compared as a set. */
function sortIds(ids: string[]): string[] {
    return [...ids].sort();
}

export async function makeOpenSearchEngine(
    index: string,
    dataType: DataType,
    records: readonly Record<string, any>[]
): Promise<ParityEngine> {
    const client: Client = await makeClient();
    const clientMetadata: ClientMetadata | undefined = getClientMetadata(client);

    await populateIndex(client, index, dataType, records as Record<string, any>[]);

    return {
        name: 'opensearch',
        async search(access, query, variables) {
            const searchParams = await access.restrictSearchQuery(query, {
                ...clientMetadata,
                variables,
                params: { index, size: records.length },
            });

            const response = await client.search(searchParams);

            return sortIds(
                response.hits.hits.map((hit) => (hit._source as Record<string, any>).id as string)
            );
        },
        async close() {
            await cleanupIndex(client, index);
        },
    };
}

export async function makeDuckDBEngine(
    table: string,
    dataType: DataType,
    records: readonly Record<string, any>[]
): Promise<ParityEngine> {
    const db = await DuckTestDB.create();

    await db.createTable(table, dataType, records);

    return {
        name: 'duckdb',
        async search(access, query, variables) {
            const sql = await access.restrictSQLQuery(query, {
                variables,
                params: { table, size: records.length },
            });

            const rows = await db.run(sql);

            return sortIds(rows.map((row) => row.id as string));
        },
        async close() {
            await db.close();
        },
    };
}
