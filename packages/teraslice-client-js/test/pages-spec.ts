import nock from 'nock';
import { TerasliceClient, pages } from '../src/index.js';
import { v2Page } from './fixtures/v2-page.js';

describe('pages', () => {
    const client = new TerasliceClient({
        baseUrl: 'http://teraslice.example.dev',
        apiVersion: '/v2'
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should follow next_cursor to the last page, resending the query', async () => {
        const scope = nock('http://teraslice.example.dev/v2')
            .get('/jobs')
            .query({ size: 2, active: true })
            .reply(200, v2Page([{ job_id: 'a' }, { job_id: 'b' }], {
                total: 3, has_more: true, next_cursor: 'c1'
            }))
            .get('/jobs')
            .query({ size: 2, active: true, cursor: 'c1' })
            .reply(200, v2Page([{ job_id: 'c' }], { total: 3, from: 2 }));

        const ids: string[] = [];
        for await (const page of pages(client.jobs.listPage, { size: 2, active: 'true' })) {
            ids.push(...page.data.map((job) => job.job_id));
        }

        expect(ids).toEqual(['a', 'b', 'c']);
        expect(scope.isDone()).toBe(true);
    });

    it('should send the cursor in place of from', async () => {
        const scope = nock('http://teraslice.example.dev/v2')
            .get('/cluster/controllers')
            .query({ from: 5, size: 1 })
            .reply(200, v2Page([{ ex_id: 'a' }], { from: 5, next_cursor: 'c1' }))
            .get('/cluster/controllers')
            .query({ size: 1, cursor: 'c1' })
            .reply(200, v2Page([{ ex_id: 'b' }], { from: 6 }));

        const froms: number[] = [];
        for await (const page of pages(client.cluster.controllersPage, { from: 5, size: 1 })) {
            froms.push(page.pagination.from);
        }

        expect(froms).toEqual([5, 6]);
        expect(scope.isDone()).toBe(true);
    });

    it('should stop after one page without a next_cursor', async () => {
        nock('http://teraslice.example.dev/v2')
            .get('/ex/some-ex-id/errors')
            .reply(200, v2Page([]));

        const results = [];
        for await (const page of pages((query) => client.executions.errorsPage('some-ex-id', query))) {
            results.push(page);
        }

        expect(results).toEqual([v2Page([])]);
    });

    it('should stop when a request fails', async () => {
        nock('http://teraslice.example.dev/v2')
            .get('/jobs')
            .reply(200, v2Page([{ job_id: 'a' }], { next_cursor: 'c1' }))
            .get('/jobs')
            .query({ cursor: 'c1' })
            .reply(400, { error: 400, message: 'cursor was made for a different query' });

        const iterator = pages(client.jobs.listPage);
        await expect(iterator.next()).resolves.toMatchObject({ done: false });
        await expect(iterator.next()).rejects.toThrow('cursor was made for a different query');
    });

    // nock >= 15 patches the shared http module, so undo it before the next test file in the worker
    afterAll(() => {
        nock.restore();
    });
});
