import { TerasliceClient, Job } from 'teraslice-client-js';
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

            // a running job, so the workers and controllers tables have rows
            const jobSpec = terasliceHarness.newJob('generator');
            if (TEST_PLATFORM === 'kubernetesV2') {
                jobSpec.resources_requests_cpu = 0.05;
            }
            job = await terasliceHarness.teraslice.jobs.submit(jobSpec);
            const { ex_id: exId } = await job.execution();
            await terasliceHarness.waitForExStatus(
                terasliceHarness.teraslice.executions.wrap(exId), 'running', 100, 1000
            );
        });

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
            type ListPage = (
                query: Record<string, any>
            ) => Promise<TerasliceApiV2.Page<Record<string, any>>>;

            const listPages: Record<string, ListPage> = {
                '/jobs': (query) => v2.jobs.listPage(query),
                '/ex': (query) => v2.executions.listPage(query),
            };

            /**
             * Requests `path` a page at a time until `has_more` is false. Returns
             * every record's `key` and the total, from a `size=0` request.
             */
            async function pageThrough(path: string, key: string, sort: string) {
                const listPage = listPages[path];
                const { pagination: { total } } = await listPage({ sort, size: 0 });
                const size = Math.max(1, Math.ceil(total / 3));

                const ids: string[] = [];
                let from = 0;
                let hasMore = true;
                while (hasMore) {
                    const page = await listPage({ sort, from, size });
                    ids.push(...page.data.map((record) => record[key]));
                    hasMore = page.pagination.has_more;
                    from += size;
                }

                return { ids, total };
            }

            it.each([
                ['/jobs', 'job_id'],
                ['/ex', 'ex_id'],
            ])('%s should return each record once, matching the total', async (path, key) => {
                const { ids, total } = await pageThrough(path, key, `${key}:asc`);

                expect(total).toBeGreaterThan(0);
                expect(ids).toBeArrayOfSize(total);
                expect(new Set(ids).size).toBe(total);
            });

            it('/txt/jobs should follow each footer\'s next link to the last page', async () => {
                const size = 2;
                const ids: string[] = [];
                let from: number | undefined = 0;
                let total = '';

                while (from !== undefined) {
                    const table: string = await v2.cluster.txt('jobs', {
                        sort: 'job_id:asc', fields: 'job_id', from, size
                    });
                    const [rows, footer] = table.split('\n\n');
                    ids.push(...rows.split('\n').slice(2)
                        .map((line) => line.trim()));

                    const [, count] = footer.match(/^Showing .* of ([\d,]+)$/m) ?? [];
                    total = count;
                    // the next line is the whole next query: these params
                    // as they were sent, each once, with the new from
                    const [, next] = footer.match(/^next: \?(\S+)$/m) ?? [];
                    const nextQuery = new URLSearchParams(next ?? '');
                    if (next) {
                        expect([...nextQuery.keys()].sort())
                            .toEqual(['fields', 'from', 'size', 'sort']);
                    }
                    from = next ? Number(nextQuery.get('from')) : undefined;
                }

                expect(ids).toBeArrayOfSize(Number(total.replaceAll(',', '')));
                expect(new Set(ids).size).toBe(ids.length);
            });
        });
    });
});
