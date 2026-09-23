import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import type { ClientMetadata } from '@terascope/types';
import type { DataType } from '@terascope/data-types';
import type { QueryAccess } from '../../src/query-access/index.js';
import { DuckTestDB } from '../sql/duckdb-helpers.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

/**
 * One engine, asked a question the same way both engines are asked it.
 *
 * `QueryAccess` is the entry point on both sides - `restrictSearchQuery` there,
 * `restrictSQLQuery` here - and each returns something its client runs unchanged. **Neither
 * implementation may assemble anything**: the moment a harness adds a clause of its own, the
 * thing under test stops being what a caller would actually execute.
*/
export interface ParityEngine {
    readonly name: string;
    /** The ids of the matching records, in ascending id order. */
    search(
        access: QueryAccess<any>, query: string, variables?: Record<string, unknown>
    ): Promise<string[]>;
    close(): Promise<void>;
}

/** Ids come back in whatever order an engine felt like; the ANSWER is the set. */
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
