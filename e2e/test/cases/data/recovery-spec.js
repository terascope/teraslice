'use strict';

const path = require('path');
const fse = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { ASSETS_PATH, CONFIG_PATH } = require('../../config');
const TerasliceHarness = require('../../teraslice-harness');
const { TEST_PLATFORM } = require('../../config');

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
    let terasliceHarness;
    let initializeTestExecution;
    let makeTerafoundationContext;

    beforeAll(async () => {
        const module = await import('teraslice');

        initializeTestExecution = module.default.initializeTestExecution;
        makeTerafoundationContext = module.default.makeTerafoundationContext;

        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    beforeAll(async () => {
        const sysconfig = await fse.readJSON(
            path.join(CONFIG_PATH, 'teraslice-master.json')
        );
        sysconfig.teraslice.assets_directory = ASSETS_PATH;
        context = makeTerafoundationContext({
            sysconfig
        });

        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
    });

    beforeEach(async () => {
        const jobSpec = terasliceHarness.newJob('generate-to-es');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'test recovery job';

        const files = await fse.readdir(ASSETS_PATH);
        jobSpec.assets = files.filter((asset) => asset.length === 40);

        specIndex = terasliceHarness.newSpecIndex('test-recovery-job');
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        terasliceHarness.injectDelay(jobSpec);

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
        recoverFromEx = terasliceHarness.teraslice.executions.wrap(recoverFromId);
        job = terasliceHarness.teraslice.jobs.wrap(exConfig.job_id);
    });

    it('can support different recovery mode cleanup=errors', async () => {
        const newEx = await recoverFromEx.recover({ cleanup: 'errors' });
        const [exConfig] = await Promise.all([
            newEx.config(),
            terasliceHarness.waitForExStatus(newEx, 'recovering'),
            terasliceHarness.waitForExStatus(newEx, 'completed')
        ]);

        const stats = await terasliceHarness.indexStats(specIndex);
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
            terasliceHarness.waitForExStatus(newEx, 'recovering'),
            terasliceHarness.waitForExStatus(newEx, 'completed')
        ]);

        const stats = await terasliceHarness.indexStats(specIndex);
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
            terasliceHarness.waitForExStatus(newEx, 'recovering'),
            terasliceHarness.waitForExStatus(newEx, 'completed')
        ]);

        const stats = await terasliceHarness.indexStats(specIndex);
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

        const newEx = terasliceHarness.teraslice.executions.wrap(newExId);
        const [exConfig] = await Promise.all([
            job.execution(),
            terasliceHarness.waitForExStatus(newEx, 'recovering'),
        ]);

        await terasliceHarness.waitForExStatus(newEx, 'running');

        await job.stop({ blocking: true });

        const { count } = await terasliceHarness.indexStats(specIndex);
        expect(count).toBeGreaterThan(200);

        const { ex_id: finalExId } = await job.start();
        const finalEx = terasliceHarness.teraslice.executions.wrap(finalExId);

        const [finalExConfig] = await Promise.all([
            finalEx.config(),
            terasliceHarness.waitForExStatus(finalEx, 'running')
        ]);

        await job.stop({ blocking: true });

        const { count: finalCount } = await terasliceHarness.indexStats(specIndex);
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
            terasliceHarness.waitForExStatus(newEx, 'recovering'),
        ]);
        await terasliceHarness.waitForExStatus(newEx, 'running');

        await newEx.stop({ blocking: true });

        const { count } = await terasliceHarness.indexStats(specIndex);
        expect(count).toBeGreaterThan(600);

        const { ex_id: finalExId } = await job.recover();
        const finalEx = terasliceHarness.teraslice.executions.wrap(finalExId);

        const [finalExConfig] = await Promise.all([
            finalEx.config(),
            terasliceHarness.waitForExStatus(finalEx, 'running')
        ]);

        await finalEx.stop({ blocking: true });

        const { count: finalCount } = await terasliceHarness.indexStats(specIndex);
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
