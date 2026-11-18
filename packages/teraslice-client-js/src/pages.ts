import type { TerasliceApiV2 } from '@terascope/types';

/** A page method, such as `jobs.listPage` */
type PageFn = (query: any) => Promise<TerasliceApiV2.Page<unknown>>;

/**
 * Yields every page of a /v2 list, following `next_cursor` until the last
 * page. `fetchPage` is a page method, such as `jobs.listPage`, and `query`
 * its first query. Each later request sends the same query with the cursor
 * in place of `from`, as the server requires.
 *
 * ```ts
 * for await (const page of pages(client.jobs.listPage, { size: 500 })) {
 *     handle(page.data);
 * }
 * ```
 */
export async function* pages<F extends PageFn>(
    fetchPage: F,
    query: NonNullable<Parameters<F>[0]> = {}
): AsyncGenerator<Awaited<ReturnType<F>>, void, undefined> {
    let page = await fetchPage(query) as Awaited<ReturnType<F>>;
    yield page;

    const { from: _from, ...rest } = query as { from?: number };
    while (page.pagination.next_cursor) {
        page = await fetchPage({
            ...rest, cursor: page.pagination.next_cursor
        }) as Awaited<ReturnType<F>>;
        yield page;
    }
}
