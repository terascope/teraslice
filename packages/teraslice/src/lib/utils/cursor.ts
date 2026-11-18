import { createHash } from 'node:crypto';
import { z } from 'zod';
import { TSError } from '@terascope/core-utils';
import type { SortValue } from '@terascope/elasticsearch-api';

/**
 * Where the next page of a list starts. A client gets it as an opaque
 * `next_cursor` string and sends it back as the `cursor` query param.
 */
export interface Cursor {
    /** The last record's sort values; the next page starts after them */
    after: SortValue[];
    /** How many records came before the next page */
    from: number;
    /** `queryKey()` of the request that made the cursor */
    key: string;
}

/** The cursor format; bump it when the format changes, so old cursors get a 400 */
const cursorVersion = 1;

/**
 * A sort value as JSON. A `bigint` (see `SortValue`) is written as
 * `{ "long": "<digits>" }`, since JSON numbers can't hold it exactly.
 */
const encodedSortValueSchema = z.union([
    z.number(),
    z.string(),
    z.null(),
    z.strictObject({ long: z.string().regex(/^-?\d+$/) })
        .transform(({ long }) => BigInt(long)),
]);

const encodedCursorSchema = z.strictObject({
    v: z.literal(cursorVersion),
    after: z.array(encodedSortValueSchema).min(1),
    from: z.int().min(0),
    key: z.string().min(1),
});

/** Turns a cursor into the opaque string a client sends back */
export function encodeCursor({ after, from, key }: Cursor): string {
    const json = JSON.stringify({
        v: cursorVersion,
        after: after.map((value) => (
            typeof value === 'bigint' ? { long: value.toString() } : value
        )),
        from,
        key,
    });
    return Buffer.from(json).toString('base64url');
}

/**
 * Reads a cursor a client sent. A cursor that can't be read, or that was
 * made by a request with a different `queryKey()`, is a 400.
 */
export function decodeCursor(cursor: string, key: string): Cursor {
    let json: unknown;
    try {
        json = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    } catch {
        throw cursorError('Invalid cursor. Send the next_cursor of a previous page as it is');
    }

    const result = encodedCursorSchema.safeParse(json);
    if (!result.success) {
        throw cursorError('Invalid cursor. Send the next_cursor of a previous page as it is');
    }

    if (result.data.key !== key) {
        throw cursorError(
            'The cursor is for a different query. Send the same params as the '
            + 'request that returned it, other than size and fields'
        );
    }

    const { after, from } = result.data;
    return { after, from, key };
}

/**
 * Identifies which records a list request matches, so a cursor can only be
 * used with the query that made it. `list` names the list (e.g. `jobs`), so
 * a JSON route and its /v2/txt copy share cursors. `params` are the ones that
 * change which records match or their order, e.g. `sort` and `filter`, but
 * not `size` or `fields`. Undefined params are left out, and the order of
 * the keys doesn't matter.
 */
export function queryKey(
    list: string,
    params: Record<string, string | number | boolean | undefined> = {}
): string {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : 1));

    return createHash('sha256')
        .update(JSON.stringify([list, entries]))
        .digest('base64url')
        .slice(0, 16);
}

/** A 400 in the same format as the router's invalid query errors */
function cursorError(message: string): TSError {
    return new TSError(`Invalid request query:\n✖ ${message}\n  → at cursor`, {
        statusCode: 400,
    });
}
