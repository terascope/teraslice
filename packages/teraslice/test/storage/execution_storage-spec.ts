import 'jest-extended';
import { jest } from '@jest/globals';
import { TestContext } from '@terascope/job-components';
import { ExecutionStorage } from '../../src/lib/storage/execution.js';

describe('ExecutionStorage', () => {
    describe('getActiveExecution', () => {
        /**
         * Search returns the stale record until the index is refreshed, like
         * a search that hasn't seen the latest status write yet (a realtime
         * GET sees a write as soon as it's indexed, search only after a refresh)
        */
        function setup(results: { stale: any[]; current: any[] }) {
            const context = new TestContext('execution-storage') as any;
            // TestContext's executionContext api has no registerMetadataFns,
            // and these tests don't use execution metadata
            Object.defineProperty(context.apis, 'executionContext', { value: undefined });
            const storage = new ExecutionStorage(context);

            const calls: string[] = [];
            let refreshed = false;
            const backend = {
                refresh: jest.fn(async () => {
                    calls.push('refresh');
                    refreshed = true;
                }),
                search: jest.fn(async () => {
                    calls.push('search');
                    return refreshed ? results.current : results.stale;
                }),
            };
            (storage as any).backend = backend;

            return { storage, backend, calls };
        }

        it('should refresh the index before searching', async () => {
            const execution = { ex_id: 'ex-1', _status: 'running' };
            const { storage, calls } = setup({ stale: [execution], current: [execution] });

            await expect(storage.getActiveExecution('ex-1')).resolves.toEqual(execution);
            expect(calls).toEqual(['refresh', 'search']);
        });

        it('should return the status written just before the call, not the one search had', async () => {
            // the controller just set "running"; search had "initializing" until the refresh
            const { storage } = setup({
                stale: [{ ex_id: 'ex-1', _status: 'initializing' }],
                current: [{ ex_id: 'ex-1', _status: 'running' }],
            });

            await expect(storage.getActiveExecution('ex-1')).resolves.toMatchObject({ _status: 'running' });
        });

        it('should throw a 404 when the execution just reached a terminal status', async () => {
            // the execution just stopped; search still had it "stopping" until the refresh
            const { storage } = setup({
                stale: [{ ex_id: 'ex-1', _status: 'stopping' }],
                current: [],
            });

            await expect(storage.getActiveExecution('ex-1')).rejects.toMatchObject({
                statusCode: 404,
                message: 'no active execution context was found for ex_id: ex-1'
            });
        });
    });
});
