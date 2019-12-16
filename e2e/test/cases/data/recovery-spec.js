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
    let exId;

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

        exId = exConfig.ex_id;
    });

    it('can support different recovery mode cleanup=errors', async () => {
        const ex = teraslice.executions.wrap(exId);
        const newEx = await ex.recover({ cleanup: 'errors' });
        await waitForExStatus(newEx, 'completed');

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(200);
    });

    it('can support different recovery mode cleanup=all', async () => {
        const ex = teraslice.executions.wrap(exId);
        const newEx = await ex.recover({ cleanup: 'all' });
        await waitForExStatus(newEx, 'completed');

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(600);
    });

    it('can support different recovery mode cleanup=pending', async () => {
        const ex = teraslice.executions.wrap(exId);
        const newEx = await ex.recover({ cleanup: 'pending' });
        await waitForExStatus(newEx, 'completed');

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toEqual(200);
    });
});
