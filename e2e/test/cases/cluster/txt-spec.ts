import { TerasliceClient, Job, pages } from 'teraslice-client-js';
import type { TerasliceApiV2 } from '@terascope/types';
import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const {
    TEST_PLATFORM, TEST_API_VERSION, HOST_IP, TERASLICE_PORT
} = config;

/** The table's lines, sorted, for tables whose row order differs between v1 and v2 */
function sortedLines(table: string): string[] {
    return table.split('\n').filter(Boolean)
        .sort();
}

describe('txt api', () => {
    // /v2/txt is compared against v1's /txt, so this only needs to run once:
    // in the v2 suite.
    // TODO: Teraslice v4 deletes /v1, remove the v1 comparisons
    // https://github.com/terascope/teraslice/issues/4584#issuecomment-6636093239
    (TEST_API_VERSION === 'v2' ? describe : describe.skip)('/v2/txt', () => {
        const host = `http://${HOST_IP}:${TERASLICE_PORT}`;
        const v1 = new TerasliceClient({ host, apiVersion: '/v1' });
        const v2 = new TerasliceClient({ host, apiVersion: '/v2' });

        let terasliceHarness: TerasliceHarness;
        let job: Job;

        beforeAll(async () => {
            terasliceHarness = new TerasliceHarness();
            await terasliceHarness.init();
            await terasliceHarness.resetState();

            // jobs to page through, without executions
            for (let i = 0; i < 5; i++) {
                await terasliceHarness.teraslice.jobs.submit(terasliceHarness.newJob('generator'), true);
            }

            // deleted jobs, which have a `_deleted_on` to sort by
            for (let i = 0; i < 3; i++) {
                const deleted = await v2.jobs.submit(terasliceHarness.newJob('generator'), true);
                await deleted.deleteJob();
            }

            // a running job, so the workers and controllers tables have rows
            const jobSpec = terasliceHarness.newJob('generator');
            if (TEST_PLATFORM === 'kubernetesV2') {
                jobSpec.resources_requests_cpu = 0.05;
            }
            job = await terasliceHarness.teraslice.jobs.submit(jobSpec);
            await waitForRunning(job);

            // stopped and started again, so there are two executions to page through
            await job.stop({ blocking: true });
            await job.start();
            await waitForRunning(job);
        });

        async function waitForRunning(runningJob: Job) {
            const { ex_id: exId } = await runningJob.execution();
            await terasliceHarness.waitForExStatus(
                terasliceHarness.teraslice.executions.wrap(exId), 'running', 100, 1000
            );
        }

        afterAll(async () => {
            await job?.stop({ blocking: true });
        });

        describe('should print the same rows as v1', () => {
            // Sorted by a unique keyword, so both versions get the same order
            it.each([
                ['jobs', { sort: 'job_id:asc' }],
                ['jobs', { sort: 'job_id:asc', from: 2, size: 2 }],
                ['jobs', { sort: 'job_id:asc', fields: 'job_id,name,workers', deleted: 'true' }],
                ['ex', { sort: 'ex_id:asc' }],
                ['ex', { sort: 'ex_id:asc', from: 1, size: 1 }],
            ] as const)('%s with %j, then add the footer', async (type, query) => {
                const [v1Table, v2Table] = await Promise.all([
                    v1.cluster.txt(type, query),
                    v2.cluster.txt(type, query),
                ]);

                expect(v2Table).toStartWith(v1Table);
                expect(v2Table.slice(v1Table.length)).toMatch(/^\nShowing /);
            });

            // v1 prints these in cluster state order and v2 sorts them, so compare
            // the rows as sets. Columns that change while the job runs (slice
            // counts, worker counts) are left out.
            it.each([
                ['workers', {}],
                ['nodes', { fields: 'node_id,state,hostname,total,pid,teraslice_version,node_version' }],
                ['controllers', { fields: 'name,job_id,ex_id' }],
            ] as const)('%s with %j, in any order', async (type, query) => {
                const [v1Table, v2Table] = await Promise.all([
                    v1.cluster.txt(type, { ...query, headers: 'false' }),
                    v2.cluster.txt(type, { ...query, headers: 'false' }),
                ]);

                expect(sortedLines(v2Table)).toEqual(sortedLines(v1Table));
                expect(sortedLines(v2Table)).not.toBeEmpty();
            });
        });

        it('should reject a field the rows don\'t have', async () => {
            await expect(v2.cluster.txt('jobs', { fields: 'job_id,nope' })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining('Unknown field "nope"'),
            });
        });

        describe('paging through every record', () => {
            type Page = TerasliceApiV2.Page<Record<string, any>>;
            type ListPage = (query: Record<string, any>) => Promise<Page>;

            const listPages: Record<string, ListPage> = {
                '/jobs': (query) => v2.jobs.listPage(query),
                '/ex': (query) => v2.executions.listPage(query),
            };

            /** A page size that splits the list into about 3 pages */
            async function pageSize(path: string, query: Record<string, any>) {
                const { pagination } = await listPages[path]({ ...query, size: 0 });
                expect(pagination.total).toBeGreaterThan(0);
                const { total } = pagination;
                return { total, size: Math.max(1, Math.floor(total / 3)) };
            }

            /** Every record's `key`, in order, paging with `from` until `has_more` is false */
            async function idsWithFrom(
                path: string, key: string, query: Record<string, any>, size: number
            ) {
                const ids: string[] = [];
                let hasMore = true;
                while (hasMore) {
                    const page = await listPages[path]({ ...query, from: ids.length, size });
                    ids.push(...page.data.map((record) => record[key]));
                    hasMore = page.pagination.has_more;
                }
                return ids;
            }

            /** Every record's `key`, in order, following `next_cursor` to the last page */
            async function idsWithCursor(
                path: string, key: string, query: Record<string, any>, size: number
            ) {
                const ids: string[] = [];
                let requests = 0;
                for await (const page of pages(listPages[path], { ...query, size })) {
                    // the cursor carries the count of records before its page
                    expect(page.pagination.from).toBe(ids.length);
                    ids.push(...page.data.map((record) => record[key]));
                    requests++;
                }
                return { ids, requests };
            }

            // `_deleted_on` is missing on every job and execution that isn't deleted, so
            // their sort values are OpenSearch's missing-value placeholders (the largest
            // long ascending, the smallest descending), which the cursor must keep exact.
            // The job_id/ex_id tiebreaker orders them.
            it.each([
                ['/jobs', 'job_id', { sort: 'job_id:asc' }],
                ['/jobs', 'job_id', { sort: '_created:desc' }],
                ['/jobs', 'job_id', { sort: '_deleted_on:asc' }],
                ['/jobs', 'job_id', { sort: '_deleted_on:desc' }],
                ['/jobs', 'job_id', { sort: '_deleted_on:desc,_created:asc' }],
                ['/jobs', 'job_id', { sort: '_deleted_on:asc', deleted: 'true' }],
                ['/jobs', 'job_id', { sort: '_deleted_on:desc', deleted: 'true' }],
                ['/ex', 'ex_id', { sort: 'ex_id:asc' }],
                ['/ex', 'ex_id', { sort: '_deleted_on:asc' }],
                ['/ex', 'ex_id', { sort: '_deleted_on:desc' }],
            ])('%s with %j should return each record once with cursors, as with from', async (path, key, query) => {
                const { total, size } = await pageSize(path, query);

                const { ids, requests } = await idsWithCursor(path, key, query, size);
                expect(requests).toBeGreaterThan(1);
                expect(ids).toBeArrayOfSize(total);
                expect(new Set(ids).size).toBe(total);

                await expect(idsWithFrom(path, key, query, size)).resolves.toEqual(ids);
            });

            it('/txt/jobs should follow each footer\'s next cursor to the last page', async () => {
                const sort = 'job_id:asc';
                const size = 2;
                const ids: string[] = [];
                let cursor: string | undefined;
                let total = '';

                do {
                    const table: string = await v2.cluster.txt('jobs', {
                        sort, fields: 'job_id', size, cursor
                    });
                    const [rows, footer] = table.split('\n\n');
                    ids.push(...rows.split('\n').slice(2)
                        .map((line) => line.trim()));

                    const [, count] = footer.match(/^Showing .* of ([\d,]+)$/m) ?? [];
                    total = count;
                    const next = footer.match(/^next: \?size=2&cursor=(\S+)$/m);
                    cursor = next?.[1];
                } while (cursor);

                expect(ids).toBeArrayOfSize(Number(total.replaceAll(',', '')));
                expect(new Set(ids).size).toBe(ids.length);
                await expect(idsWithFrom('/jobs', 'job_id', { sort }, size)).resolves.toEqual(ids);
            });

            it('should reject a cursor sent with a different sort', async () => {
                const { pagination } = await v2.jobs.listPage({ sort: 'job_id:asc', size: 1 });
                expect(pagination.next_cursor).toBeString();

                await expect(v2.jobs.listPage({
                    sort: 'job_id:desc', size: 1, cursor: pagination.next_cursor as string
                })).rejects.toMatchObject({ statusCode: 400 });
            });
        });
    });
});
