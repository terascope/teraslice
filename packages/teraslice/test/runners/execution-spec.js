'use strict';

const events = require('events');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const executionCode = require('../../lib/cluster/runners/execution');

const eventEmitter = new events.EventEmitter();

describe('execution runner', () => {
    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {}
    };
    const testRegisterApi = {};

    const assetId = '1234';
    const testDir = path.join(__dirname, 'execution_test');
    const assetPath = `${testDir}/${assetId}`;
    const processorPath = path.join(__dirname, '../../lib/processors/noop.js');

    const job = {
        operations: [
            { _op: 'elasticsearch_data_generator' },
            { _op: 'noop' }
        ]
    };

    // TODO do something with assets_dir
    const context = {
        sysconfig: {
            teraslice: {
                assets_directory: testDir
            }
        },
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter,
                getConnection: () => ({ client: () => true })
            },
            registerAPI: (key, obj) => {
                testRegisterApi[key] = obj;
            }
        },
        logger,
        __test_assignment: 'execution_controller',
        __test_job: JSON.stringify(job)
    };

    beforeEach(() => fs.remove(testDir).then(() => fs.ensureDir(testDir)));

    afterEach(() => fs.remove(testDir));

    // we will async copy an op over to simulate the downloading of an asset
    function simulateAssetDownload(timeout, _data, _fileName) {
        const fileName = _fileName || 'assetTest';
        return new Promise((resolve) => {
            setTimeout(() => {
                const data = _data || {};
                fs.copySync(processorPath, `${assetPath}/${fileName}.js`);
                eventEmitter.emit('execution:assets_loaded', data);
                resolve();
            }, timeout);
        });
    }

    it('will not throw on call', () => {
        expect(() => { executionCode(context); }).not.toThrowError();
    });

    it('can initialize', (done) => {
        const executionRunner = executionCode(context).__test_context();

        executionRunner.initialize(eventEmitter, logger)
            .then((results) => {
                expect(results).toBeDefined();
                expect(results.reader).toEqual(undefined);
                expect(results.queue).toBeDefined();
                expect(results.queue.length).toEqual(0);
                expect(results.config).toBeDefined();
                expect(results.config).toEqual(job);
                expect(results.slicer).toBeDefined();
                expect(typeof results.slicer).toEqual('object');
                expect(results.slicer.newReader).toBeDefined();
                expect(typeof results.slicer.newReader).toEqual('function');
                expect(results.slicer.newSlicer).toBeDefined();
                expect(typeof results.slicer.newSlicer).toEqual('function');
                expect(results.slicer.schema).toBeDefined();
                expect(typeof results.slicer.schema).toEqual('function');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('will fail if no assets are needed and it cant find the code', (done) => {
        const assetjob = {
            operations: [{ _op: 'assetTest' }, { _op: 'noop' }]
        };
        const newContext = _.cloneDeep(context);
        newContext.__test_job = JSON.stringify(assetjob);
        const executionRunner = executionCode(newContext).__test_context();

        executionRunner.initialize(eventEmitter, logger)
            .catch((err) => {
                expect(err).toBeDefined();
                expect(typeof err).toEqual('string');
            })
            .finally(() => { done(); });
    });

    it('execution_controller can wait for an asset while initializing', (done) => {
        const assetjob = {
            assets: [assetId],
            operations: [{ _op: 'assetTest' }, { _op: 'noop' }]
        };
        const newContext = _.cloneDeep(context);
        newContext.__test_job = JSON.stringify(assetjob);
        const executionRunner = executionCode(newContext).__test_context();

        Promise.all([executionRunner.initialize(eventEmitter, logger), simulateAssetDownload(200)])
            .spread((results) => {
                expect(results).toBeDefined();
                expect(results.reader).toEqual(undefined);
                expect(results.queue).toBeDefined();
                expect(results.queue.length).toEqual(0);
                expect(results.config).toBeDefined();
                expect(results.config).toEqual(assetjob);
                expect(results.slicer).toBeDefined();
                expect(typeof results.slicer).toEqual('object');
                expect(results.slicer.newProcessor).toBeDefined();
                expect(typeof results.slicer.newProcessor).toEqual('function');
                expect(results.slicer.schema).toBeDefined();
                expect(typeof results.slicer.schema).toEqual('function');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('worker can wait for an asset while initializing', (done) => {
        const assetjob = {
            assets: [assetId],
            operations: [{ _op: 'elasticsearch_data_generator' }, { _op: 'assetTest' }]
        };
        const newContext = _.cloneDeep(context);
        newContext.__test_job = JSON.stringify(assetjob);
        newContext.__test_assignment = 'worker';
        const executionRunner = executionCode(newContext).__test_context();

        Promise.all([executionRunner.initialize(eventEmitter, logger), simulateAssetDownload(200)])
            .spread((results) => {
                expect(results).toBeDefined();
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can fail if downloading asset failed', (done) => {
        const assetjob = {
            assets: [assetId],
            operations: [{ _op: 'assetTest2' }, { _op: 'noop' }]
        };

        const newContext = _.cloneDeep(context);
        newContext.__test_job = JSON.stringify(assetjob);
        const executionRunner = executionCode(newContext).__test_context();

        Promise.all([
            executionRunner.initialize(eventEmitter, logger),
            simulateAssetDownload(200, { error: 'test error' }, 'assetTest2')
        ])
            .then(fail)
            .catch((err) => {
                expect(err).toBeDefined();
                expect(typeof err).toEqual('string');
            })
            .finally(() => { done(); });
    });

    it('can fail if assets downloaded but fails to instantiate', (done) => {
        const assetjob = {
            assets: [assetId],
            operations: [{ _op: 'fail' }]
        };
        fs.copySync(path.join(__dirname, 'processors', 'fail.js'), path.join(assetPath, 'fail.js'));
        const newContext = _.cloneDeep(context);
        newContext.__test_job = JSON.stringify(assetjob);
        const executionRunner = executionCode(newContext).__test_context();

        executionRunner.initialize(eventEmitter, logger)
            .catch((err) => {
                expect(err).toBeDefined();
                expect(typeof err).toEqual('string');
            })
            .finally(() => { done(); });
    });


    it('can instantiate an execution', (done) => {
        const exRunnerSlicer = executionCode(context).__test_context();
        const newContext = _.cloneDeep(context);
        newContext.__test_assignment = 'worker';
        const exRunnerWorker = executionCode(newContext).__test_context();

        Promise.all([exRunnerSlicer._instantiateJob(), exRunnerWorker._instantiateJob()])
            .spread((slicerExe, workerExe) => {
                expect(slicerExe).toBeDefined();
                expect(slicerExe.reader).toEqual(undefined);
                expect(slicerExe.queue).toBeDefined();
                expect(slicerExe.queue.length).toEqual(0);
                expect(slicerExe.config).toBeDefined();
                expect(slicerExe.config).toEqual(job);
                expect(slicerExe.slicer).toBeDefined();
                expect(typeof slicerExe.slicer).toEqual('object');
                expect(slicerExe.slicer.newReader).toBeDefined();
                expect(typeof slicerExe.slicer.newReader).toEqual('function');
                expect(slicerExe.slicer.newSlicer).toBeDefined();
                expect(typeof slicerExe.slicer.newSlicer).toEqual('function');
                expect(slicerExe.slicer.schema).toBeDefined();
                expect(typeof slicerExe.slicer.schema).toEqual('function');

                expect(workerExe).toBeDefined();
                expect(workerExe.reader).toBeDefined();
                expect(typeof workerExe.reader).toEqual('function');
                expect(workerExe.queue).toBeDefined();
                expect(workerExe.queue.length).toEqual(2);
                expect(workerExe.config).toBeDefined();
                expect(workerExe.config).toEqual(job);
                expect(workerExe.slicer).toEqual(null);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('analyze returns a function what captures the time it took to complete a step, data in and data out', (done) => {
        const { analyze } = executionCode(context).__test_context();

        const fn = function (data) {
            return new Promise(((resolve) => {
                setTimeout(() => {
                    resolve(data);
                }, 10);
            }));
        };

        function waitFor() {
            return new Promise(resolve => setTimeout(() => resolve(true), 15));
        }

        const analyticsObj = { time: [], size: [], memory: [] };
        const dataIn = [{ some: 'insideData' }];
        const analyzedFn = analyze(fn, 0);

        Promise.all([analyzedFn(analyticsObj, dataIn), waitFor()])
            .spread((data) => {
                expect(Array.isArray(data)).toBe(true);
                expect(data[0].some).toEqual('insideData');
                expect(analyticsObj.time.length).toEqual(1);
                expect(analyticsObj.size.length).toEqual(1);
                expect(analyticsObj.memory.length).toEqual(1);

                expect(analyticsObj.time[0] >= 0).toBe(true);
                expect(analyticsObj.size[0]).toEqual(1);
                expect(analyticsObj.memory[0] >= 0).toBe(true);
                return Promise.all([analyzedFn(analyticsObj, dataIn), waitFor()]);
            })
            .then(() => {
            // we check to make sure retried calls don't add extra data
                expect(analyticsObj.time.length).toEqual(1);
                expect(analyticsObj.size.length).toEqual(1);
                expect(analyticsObj.memory.length).toEqual(1);
            })
            .finally(() => {
                done();
            });
    });

    it('insertAnalyzers takes an array of functions and returns them wrapped with the analyze function', () => {
        const { insertAnalyzers } = executionCode(context);
        const fnArray = [() => {}, () => {}];
        const results = insertAnalyzers(fnArray);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toEqual(2);
        expect(typeof results[0]).toEqual('function');
    });

    it('registers getOpConfig', () => {
        const op1 = { _op: 'elasticsearch_data_generator', more: 'config' };
        const op2 = { _op: 'noop', other: 'config' };
        const assetjob = {
            assets: [assetId],
            operations: [op1, op2]
        };
        const newContext = _.cloneDeep(context);
        newContext.__test_job = JSON.stringify(assetjob);
        executionCode(newContext).__test_context();
        // This tests that job_runner api is available as soon as the module comes up
        expect(testRegisterApi.job_runner).toBeDefined();
        expect(typeof testRegisterApi.job_runner).toEqual('object');
        expect(typeof testRegisterApi.job_runner.getOpConfig).toEqual('function');

        expect(testRegisterApi.job_runner.getOpConfig('elasticsearch_data_generator')).toEqual(op1);
        expect(testRegisterApi.job_runner.getOpConfig('noop')).toEqual(op2);
        expect(testRegisterApi.job_runner.getOpConfig('somethingElse')).toEqual(undefined);
    });
});
