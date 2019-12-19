'use strict';

const path = require('path');
const fse = require('fs-extra');
const uuidv4 = require('uuid/v4');
const {
    initializeTestExecution,
    makeTerafoundationContext
} = require('teraslice');

const misc = require('../../misc');
const { waitForExStatus } = require('../../wait');
const { resetState } = require('../../helpers');

const teraslice = misc.teraslice();

describe('recovery', () => {
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
            isRecovery: true,
            createRecovery: false,
            recoverySlices: [
                {
                    state: 'completed',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
                        slicer_id: 0,
                        slicer_order: 0,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'completed',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
                        slicer_id: 0,
                        slicer_order: 1,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'start',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
                        slicer_id: 0,
                        slicer_order: 2,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'error',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
                        slicer_id: 0,
                        slicer_order: 3,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'start',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
                        slicer_id: 0,
                        slicer_order: 4,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'pending',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
                        slicer_id: 0,
                        slicer_order: 5,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'error',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
                        slicer_id: 0,
                        slicer_order: 6,
                        _created: new Date().toISOString()
                    }
                },
                {
                    state: 'pending',
                    slice: {
                        slice_id: uuidv4(),
                        request: 100,
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
            previous_execution: recoverFromId,
            recovered_execution: recoverFromId,
            recovered_slice_type: 'errors'
        });

        await expect(newEx.recover({ cleanup_type: 'errors' }))
            .rejects.toThrowError('No error slices found to recover');
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
            previous_execution: recoverFromId,
            recovered_execution: recoverFromId,
            recovered_slice_type: 'all'
        });

        await expect(newEx.recover({ cleanup_type: 'all' }))
            .rejects.toThrowError('No slices found to recover');
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
            previous_execution: recoverFromId,
            recovered_execution: recoverFromId,
            recovered_slice_type: 'pending'
        });

        await expect(newEx.recover({ cleanup_type: 'pending' }))
            .rejects.toThrowError('No pending slices found to recover');
    });

    it('can support autorecovery', async () => {
        await job.updatePartial({ autorecover: true });
        const { ex_id: newExId } = await job.start();
        expect(newExId).not.toBe(recoverFromId);

        const newEx = teraslice.executions.wrap(newExId);
        const [exConfig] = await Promise.all([
            job.execution(),
            waitForExStatus(newEx, 'recovering'),
            // give the execution time to run for second
            // after recovering
            waitForExStatus(newEx, 'running', 5000)
        ]);

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
        expect(finalCount).not.toBeGreaterThan(count);

        expect(exConfig).toMatchObject({
            autorecover: true,
            ex_id: newEx.id(),
            previous_execution: recoverFromId,
            recovered_execution: recoverFromId,
            recovered_slice_type: 'pending'
        });

        expect(finalExConfig).toMatchObject({
            autorecover: true,
            ex_id: finalEx.id(),
            previous_execution: newEx.id(),
            recovered_slice_type: 'pending'
        });
        expect(finalExConfig.recovered_execution).toBeNil();
    });

    it('can support recovery without a cleanup type', async () => {
        const newEx = await recoverFromEx.recover();

        const [exConfig] = await Promise.all([
            newEx.config(),
            waitForExStatus(newEx, 'recovering'),
            // give the execution time to run for second
            // after recovering
            waitForExStatus(newEx, 'running', 5000)
        ]);

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
        expect(finalCount).not.toBeGreaterThan(count);

        expect(exConfig).toMatchObject({
            ex_id: newEx.id(),
            previous_execution: recoverFromId,
            recovered_execution: recoverFromId,
        });

        expect(finalExConfig).toMatchObject({
            ex_id: finalEx.id(),
            previous_execution: newEx.id(),
            recovered_execution: newEx.id(),
        });

        expect(finalExConfig.recovered_slice_type).toBeNil();
        expect(exConfig.recovered_slice_type).toBeNil();
    });
});
