import path from 'path';
import fse from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import {
    initializeTestExecution,
    makeTerafoundationContext
} from 'teraslice';
import misc from '../../misc';
import { waitForExStatus } from '../../wait';
import { resetState } from '../../helpers';

const teraslice = misc.teraslice();

describe('recovery', () => {
    const stores = {};
    let context;
    let specIndex;
    let recoverFromId;
    /**
     * @type {import('teraslice-client-js').Ex}
    */
    let recoverFromEx;
    /**
     * @type {import('teraslice-client-js').Job}
    */
    let job;

    beforeAll(async () => {
        const sysconfig = await fse.readJSON(
            path.join(misc.CONFIG_PATH, 'teraslice-master.json')
        );
        sysconfig.teraslice.assets_directory = misc.ASSETS_PATH;
        context = makeTerafoundationContext({
            sysconfig
        });
        await resetState();
    });

    beforeEach(async () => {
        const jobSpec = misc.newJob('generate-to-es');
        jobSpec.name = 'test recovery job';

        const files = await fse.readdir(misc.ASSETS_PATH);
        jobSpec.assets = files.filter((asset) => asset.length === 40);

        specIndex = misc.newSpecIndex('test-recovery-job');
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        misc.injectDelay(jobSpec);

        const { ex: exConfig } = await initializeTestExecution({
            context,
            config: jobSpec,
            stores,
            isRecovery: true,
            createRecovery: false,
            recoverySlices: [
                {
                    state: 'completed',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 0,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'completed',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 1,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'start',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 2,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'error',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 3,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'start',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 4,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'pending',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 5,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'error',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 6,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'pending',
                    slice: {
                        slice_id: uuidv4(),
                        request: { count: 100 },
                        slicer_id: 0,
                        slicer_order: 7,
                        _created: new Date().toISOString()
                    }
                }
            ],
            lastStatus: 'failed'
        });

        recoverFromId = exConfig.ex_id;
        recoverFromEx = teraslice.executions.wrap(recoverFromId);
        job = teraslice.jobs.wrap(exConfig.job_id);
    });

    it('can support different recovery mode cleanup=errors', async () => {
        const newEx = await recoverFromEx.recover({ cleanup: 'errors' });
        const [exConfig] = await Promise.all([
            newEx.config(),
            waitForExStatus(newEx, 'recovering'),
            waitForExStatus(newEx, 'completed')
        ]);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(200);

        expect(exConfig).toMatchObject({
            ex_id: newEx.id(),
            recovered_execution: recoverFromId,
            recovered_slice_type: 'errors'
        });
    });

    it('can support different recovery mode cleanup=all', async () => {
        const newEx = await recoverFromEx.recover({ cleanup: 'all' });

        const [exConfig] = await Promise.all([
            newEx.config(),
            waitForExStatus(newEx, 'recovering'),
            waitForExStatus(newEx, 'completed')
        ]);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(600);

        expect(exConfig).toMatchObject({
            ex_id: newEx.id(),
            recovered_execution: recoverFromId,
            recovered_slice_type: 'all'
        });
    });

    it('can support different recovery mode cleanup=pending', async () => {
        const newEx = await recoverFromEx.recover({ cleanup: 'pending' });

        const [exConfig] = await Promise.all([
            newEx.config(),
            waitForExStatus(newEx, 'recovering'),
            waitForExStatus(newEx, 'completed')
        ]);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(200);

        expect(exConfig).toMatchObject({
            ex_id: newEx.id(),
            recovered_execution: recoverFromId,
            recovered_slice_type: 'pending'
        });
    });

    it('can support autorecovery', async () => {
        await job.updatePartial({ autorecover: true });
        const { ex_id: newExId } = await job.start();
        expect(newExId).not.toBe(recoverFromId);

        const newEx = teraslice.executions.wrap(newExId);
        const [exConfig] = await Promise.all([
            job.execution(),
            waitForExStatus(newEx, 'recovering'),
        ]);

        await waitForExStatus(newEx, 'running');

        await job.stop({ blocking: true });

        const { count } = await misc.indexStats(specIndex);
        expect(count).toBeGreaterThan(200);

        const { ex_id: finalExId } = await job.start();
        const finalEx = teraslice.executions.wrap(finalExId);

        const [finalExConfig] = await Promise.all([
            finalEx.config(),
            waitForExStatus(finalEx, 'running')
        ]);

        await job.stop({ blocking: true });

        const { count: finalCount } = await misc.indexStats(specIndex);
        expect(finalCount).toBeGreaterThan(count);

        expect(exConfig).toMatchObject({
            autorecover: true,
            ex_id: newEx.id(),
            recovered_execution: recoverFromId,
            recovered_slice_type: 'pending'
        });

        expect(finalExConfig).toMatchObject({
            autorecover: true,
            ex_id: finalEx.id(),
            recovered_slice_type: 'pending'
        });
    });

    it('can support recovery without a cleanup type', async () => {
        const newEx = await recoverFromEx.recover();

        const [exConfig] = await Promise.all([
            newEx.config(),
            waitForExStatus(newEx, 'recovering'),
        ]);
        await waitForExStatus(newEx, 'running');

        await newEx.stop({ blocking: true });

        const { count } = await misc.indexStats(specIndex);
        expect(count).toBeGreaterThan(600);

        const { ex_id: finalExId } = await job.recover();
        const finalEx = teraslice.executions.wrap(finalExId);

        const [finalExConfig] = await Promise.all([
            finalEx.config(),
            waitForExStatus(finalEx, 'running')
        ]);

        await finalEx.stop({ blocking: true });

        const { count: finalCount } = await misc.indexStats(specIndex);
        expect(finalCount).toBeGreaterThan(count);

        expect(exConfig).toMatchObject({
            ex_id: newEx.id(),
            recovered_execution: recoverFromId,
        });

        expect(finalExConfig).toMatchObject({
            ex_id: finalEx.id(),
            recovered_execution: newEx.id(),
        });

        expect(finalExConfig.recovered_slice_type).toBeNil();
        expect(exConfig.recovered_slice_type).toBeNil();
    });
});
