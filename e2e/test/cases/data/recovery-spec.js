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
        await Promise.all([
            waitForExStatus(newEx, 'recovering'),
            waitForExStatus(newEx, 'completed')
        ]);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(200);
    });

    it('can support different recovery mode cleanup=all', async () => {
        const newEx = await recoverFromEx.recover({ cleanup: 'all' });

        await Promise.all([
            waitForExStatus(newEx, 'recovering'),
            waitForExStatus(newEx, 'completed')
        ]);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(600);
    });

    it('can support different recovery mode cleanup=pending', async () => {
        const newEx = await recoverFromEx.recover({ cleanup: 'pending' });
        await Promise.all([
            waitForExStatus(newEx, 'recovering'),
            waitForExStatus(newEx, 'completed')
        ]);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(200);
    });

    it('can support autorecovery', async () => {
        await job.updatePartial({ autorecover: true });
        const { ex_id: newExId } = await job.start();
        const newEx = teraslice.executions.wrap(newExId);
        await Promise.all([
            waitForExStatus(newEx, 'recovering'),
            waitForExStatus(newEx, 'completed')
        ]);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(200);
    });
});
