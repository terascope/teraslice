import 'jest-extended';
import { jest } from '@jest/globals';
import { TestContext } from '@terascope/job-components';
import { JobsService } from '../../src/lib/cluster/services/jobs.js';

describe('JobsService', () => {
    const jobId = 'job-1';
    const job = { job_id: jobId, name: 'test', operations: [] };
    const latestEx = { ex_id: 'ex-0', job_id: jobId, _status: 'stopped', slicers: 1 };
    const newExecution = { job_id: jobId, ex_id: 'ex-1' };
    const terminalStatuses = ['stopped', 'failed', 'completed', 'rejected', 'terminated'];

    /** a k8s resource labeled with the execution that owns it */
    function k8sResource(exId?: string) {
        return { metadata: { labels: exId ? { 'teraslice.terascope.io/exId': exId } : {} } };
    }

    function setup({
        activeExecution,
        resources = [],
        deleted = false,
    }: {
        activeExecution?: Record<string, any>;
        resources?: any[][];
        deleted?: boolean;
    } = {}) {
        const context = new TestContext('jobs-service') as any;
        const service = new JobsService(context);

        // `_getActiveExecution` searches with a NOT (terminal statuses) query,
        // `getLatestExecution` without one
        const search = jest.fn(async (query: string) => {
            if (query.includes('NOT')) return activeExecution ? [activeExecution] : [];
            return [latestEx];
        });

        service.jobsStorage = {
            get: jest.fn(async () => ({ ...job, _deleted: deleted })),
        } as any;
        service.executionStorage = {
            search,
            getTerminalStatuses: () => terminalStatuses.slice(),
        } as any;

        const executionService = {
            listResourcesForJobId: jest.fn(async () => resources),
            createExecutionContext: jest.fn(async () => newExecution),
            recoverExecution: jest.fn(async () => newExecution),
        };
        service.executionService = executionService as any;

        jest.spyOn(service as any, '_validateJobSpec')
            .mockImplementation(async () => ({ jobConfig: { ...job, slicers: 1 }, warnings: [] }));

        return { service, executionService };
    }

    describe('assertJobCanRun', () => {
        it('should resolve when the job has no active execution or k8s resources', async () => {
            const { service } = setup();

            await expect(service.assertJobCanRun(jobId)).resolves.toBeUndefined();
        });

        it('should throw a 409 when the job has an active execution', async () => {
            const { service, executionService } = setup({
                activeExecution: { ex_id: 'ex-0', job_id: jobId, _status: 'running' }
            });

            await expect(service.assertJobCanRun(jobId)).rejects.toMatchObject({
                statusCode: 409,
                message: `Job ${jobId} has an active execution ex-0 (status: "running"), `
                    + 'cannot have the same job concurrently running'
            });
            expect(executionService.listResourcesForJobId).not.toHaveBeenCalled();
        });

        it('should throw a 409 listing each execution that has leftover k8s resources', async () => {
            const { service } = setup({
                resources: [
                    [k8sResource('ex-0'), k8sResource('ex-0')],
                    [k8sResource('ex-9'), k8sResource()],
                ]
            });

            await expect(service.assertJobCanRun(jobId)).rejects.toMatchObject({
                statusCode: 409,
                message: `There are orphaned resources for job: ${jobId}, exId: ex-0, ex-9. `
                    + 'Please wait for Kubernetes to clean up orphaned resources.'
            });
        });
    });

    describe('startJob', () => {
        it('should create an execution when the job can run', async () => {
            const { service, executionService } = setup();

            await expect(service.startJob(jobId)).resolves.toEqual(newExecution);
            expect(executionService.createExecutionContext).toHaveBeenCalledOnce();
        });

        it.each([
            ['an active execution', { activeExecution: { ex_id: 'ex-0', _status: 'running' } }],
            ['leftover k8s resources', { resources: [[k8sResource('ex-0')]] }],
        ])('should throw a 409 and not create an execution when the job has %s', async (_, options) => {
            const { service, executionService } = setup(options);

            await expect(service.startJob(jobId)).rejects.toMatchObject({ statusCode: 409 });
            expect(executionService.createExecutionContext).not.toHaveBeenCalled();
            expect(executionService.recoverExecution).not.toHaveBeenCalled();
        });
    });

    describe('recoverJob', () => {
        it('should recover the latest execution when the job can run', async () => {
            const { service, executionService } = setup();

            await expect(service.recoverJob(jobId, 'errors' as any)).resolves.toEqual(newExecution);
            expect(executionService.recoverExecution).toHaveBeenCalledWith(
                expect.objectContaining({ ex_id: 'ex-0', job_id: jobId }),
                'errors'
            );
        });

        it.each([
            ['an active execution', { activeExecution: { ex_id: 'ex-0', _status: 'running' } }],
            ['leftover k8s resources', { resources: [[k8sResource('ex-0')]] }],
        ])('should throw a 409 and not store an execution when the job has %s', async (_, options) => {
            const { service, executionService } = setup(options);

            await expect(service.recoverJob(jobId)).rejects.toMatchObject({ statusCode: 409 });
            expect(executionService.recoverExecution).not.toHaveBeenCalled();
            expect(executionService.createExecutionContext).not.toHaveBeenCalled();
        });

        it('should throw a 410 and not store an execution for a deleted job', async () => {
            const { service, executionService } = setup({ deleted: true });

            await expect(service.recoverJob(jobId)).rejects.toMatchObject({ statusCode: 410 });
            expect(executionService.recoverExecution).not.toHaveBeenCalled();
        });
    });
});
