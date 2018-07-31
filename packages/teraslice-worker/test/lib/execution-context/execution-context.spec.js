'use strict';

/* eslint-disable no-new */

const path = require('path');
const get = require('lodash/get');
const ExecutionContext = require('../../../lib/execution-context/execution-context');
const { TestContext, opsPath } = require('../../helpers');

const exampleAssetDir = path.join(opsPath, 'example-asset');

describe('Execution Context', () => {
    describe('when constructed', () => {
        let executionContext;
        let testContext;

        beforeEach(() => {
            testContext = new TestContext({
                assignment: 'worker',
                operations: [
                    {
                        _op: 'example-op-one',
                    },
                    {
                        _op: 'example-op-two',
                    }
                ],
            });

            executionContext = new ExecutionContext(testContext.context, testContext.config);
        });

        afterEach(() => testContext.cleanup());

        it('should throw an error if reporters are specified', () => {
            testContext.context.sysconfig.teraslice.reporter = true;
            expect(() => {
                new ExecutionContext(
                    testContext.context,
                    { hello: true }
                );
            }).toThrowError('reporters are not functional at this time, please do not set one in the configuration');
        });

        it('should have a method initialize', () => {
            expect(executionContext.initialize).toBeFunction();
        });

        it('should register the api job_runner', () => {
            const jobRunnerApis = get(testContext, 'context.apis.job_runner');

            expect(jobRunnerApis).toHaveProperty('getOpConfig');
            expect(jobRunnerApis.getOpConfig).toBeFunction();
        });

        it('getOpConfig should return the matching op', () => {
            expect(executionContext._getOpConfig('example-op-one')).toEqual({
                _op: 'example-op-one',
            });

            const getOpConfig = get(testContext, 'context.apis.job_runner.getOpConfig');
            expect(getOpConfig('example-op-one')).toEqual({
                _op: 'example-op-one',
            });
        });

        it('getOpConfig should return nothing if none found', () => {
            expect(executionContext._getOpConfig('this-op-does-not-exist')).toBeNil();

            const getOpConfig = get(testContext, 'context.apis.job_runner.getOpConfig');
            expect(getOpConfig('this-op-does-not-exist')).toBeNil();
        });
    });

    describe('when using assignment "worker"', () => {
        describe('when op name is not a string', () => {
            let executionContext;
            let testContext;

            beforeEach(() => {
                testContext = new TestContext({
                    assignment: 'worker',
                    operations: [
                        {
                            _op: null,
                        }
                    ]
                });
                executionContext = new ExecutionContext(testContext.context, testContext.config);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should reject with an error', () => {
                const errMsg = 'please verify that ops_directory in config and _op for each job operations are strings';
                return expect(executionContext.initialize()).rejects.toThrow(errMsg);
            });
        });

        describe('when analytics is not enabled', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'worker',
                    operations: [
                        {
                            _op: path.join(opsPath, 'example-reader'),
                            exampleProp: 321
                        },
                        {
                            _op: path.join(opsPath, 'example-op'),
                            exampleProp: 123
                        }
                    ],
                });

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(2);
                expect(executionContext.queue[0]).toBeFunction();
                expect(executionContext.queue[1]).toBeFunction();
                expect(executionContext.reader).toEqual(executionContext.queue[0]);
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toBeNil();
            });
        });

        describe('when analytics is enabled', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'worker',
                    analytics: true,
                    operations: [
                        {
                            _op: path.join(opsPath, 'example-reader'),
                            exampleProp: 321
                        },
                        {
                            _op: path.join(opsPath, 'example-op'),
                            exampleProp: 123
                        }
                    ]
                });

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(2);
                expect(executionContext.queue[0]).toBeFunction();
                expect(executionContext.queue[1]).toBeFunction();
                expect(executionContext.reader).toEqual(executionContext.queue[0]);
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toBeNil();
            });
        });

        describe('when using assets', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'worker',
                    operations: [
                        {
                            _op: 'example-asset-reader',
                        },
                        {
                            _op: 'example-asset-op',
                        }
                    ],
                    assets: ['example-asset'],
                });

                await testContext.saveAsset(exampleAssetDir);

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(2);
                expect(executionContext.reader).toBeFunction();
                expect(executionContext.queue[1]).toBeFunction();
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toBeNil();
            });

            it('should load the ops', async () => {
                const { executionContext } = testContext;

                const readerResults = await executionContext.reader();
                expect(readerResults).toBeArrayOfSize(100);
                const opResults = await executionContext.queue[1](readerResults);
                expect(opResults).toBeArrayOfSize(100);
            });
        });

        describe('when using assets that have not been downloaded', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'worker',
                    assets: ['example-asset'],
                    operations: [
                        {
                            _op: 'example-asset-reader',
                        },
                        {
                            _op: 'example-asset-op',
                        }
                    ]
                });

                await testContext.saveAsset(exampleAssetDir, true);

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(2);
                expect(executionContext.reader).toBeFunction();
                expect(executionContext.queue[1]).toBeFunction();
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toBeNil();
            });

            it('should load the ops', async () => {
                const { executionContext } = testContext;

                const readerResults = await executionContext.reader();
                expect(readerResults).toBeArrayOfSize(100);
                const opResults = await executionContext.queue[1](readerResults);
                expect(opResults).toBeArrayOfSize(100);
            });
        });

        describe('when using assets and they do not exist', () => {
            let executionContext;
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'worker',
                    assets: ['missing-assets'],
                    operations: [
                        {
                            _op: 'missing-assets-reader',
                        },
                        {
                            _op: 'missing-assets-op',
                        }
                    ]
                });

                executionContext = new ExecutionContext(testContext.context, testContext.config);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should reject with a error', () => {
                const errMsg = 'asset: missing-assets was not found';
                return expect(executionContext.initialize()).rejects.toThrowError(errMsg);
            });
        });

        describe('when using assets and the fail on require', () => {
            let executionContext;
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'worker',
                    assets: ['failing-asset'],
                    operations: [
                        {
                            _op: 'failing-asset-reader',
                        }
                    ]
                });
                await testContext.saveAsset(path.join(opsPath, 'failing-asset'));

                executionContext = new ExecutionContext(testContext.context, testContext.config);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should reject with a error', () => {
                const errMsg = new RegExp('Could not retrieve code for: failing-asset-reader');
                return expect(executionContext.initialize()).rejects.toThrowError(errMsg);
            });
        });
    });

    describe('when using assignment "execution_controller"', () => {
        describe('when op name is not a string', () => {
            let executionContext;
            let testContext;
            beforeEach(() => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    operations: [
                        {
                            _op: null,
                        }
                    ]
                });
                executionContext = new ExecutionContext(testContext.context, testContext.config);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should reject with an error', () => {
                const errMsg = 'please verify that ops_directory in config and _op for each job operations are strings';
                return expect(executionContext.initialize()).rejects.toThrow(errMsg);
            });
        });

        describe('when using a valid job configuration', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                });

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(0);
                expect(executionContext.reader).toBeNil();
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toHaveProperty('newSlicer');
                expect(executionContext).toHaveProperty('queueLength', 10);
                expect(executionContext).toHaveProperty('dynamicQueueLength', false);
            });
        });

        describe('when using a dynamic queue length', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    slicerQueueLength: 'QUEUE_MINIMUM_SIZE'
                });

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(0);
                expect(executionContext.reader).toBeNil();
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toHaveProperty('newSlicer');
                expect(executionContext).toHaveProperty('queueLength', 1);
                expect(executionContext).toHaveProperty('dynamicQueueLength', true);
            });
        });

        describe('when using assets', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    operations: [
                        {
                            _op: 'example-asset-reader',
                        },
                        {
                            _op: 'example-asset-op',
                        }
                    ],
                    assets: ['example-asset'],
                });

                await testContext.saveAsset(exampleAssetDir);

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(0);
                expect(executionContext.reader).toBeNil();
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toHaveProperty('newSlicer');
                expect(executionContext).toHaveProperty('queueLength', 10000);
                expect(executionContext).toHaveProperty('dynamicQueueLength', false);
            });

            it('should be able to run the slicer', async () => {
                const { executionContext } = testContext;

                const slicer = await executionContext.slicer.newSlicer();
                const results = await slicer();
                expect(results).toBeArrayOfSize(100);
            });
        });

        describe('when using assets that have not been downloaded', () => {
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    assets: ['example-asset'],
                    operations: [
                        {
                            _op: 'example-asset-reader',
                        },
                        {
                            _op: 'example-asset-op',
                        }
                    ]
                });

                await testContext.saveAsset(exampleAssetDir, true);

                await testContext.initialize();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should resolve an execution api', () => {
                const { executionContext } = testContext;

                expect(executionContext.queue).toBeArrayOfSize(0);
                expect(executionContext.reader).toBeNil();
                expect(executionContext.config).toEqual(testContext.config.job);
                expect(executionContext.reporter).toBeNil();
                expect(executionContext.slicer).toHaveProperty('newSlicer');
                expect(executionContext).toHaveProperty('queueLength', 10000);
                expect(executionContext).toHaveProperty('dynamicQueueLength', false);
            });

            it('should be able to run the slicer', async () => {
                const { executionContext } = testContext;

                const slicer = await executionContext.slicer.newSlicer();
                const results = await slicer();
                expect(results).toBeArrayOfSize(100);
            });
        });

        describe('when using assets and they do not exist', () => {
            let executionContext;
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    assets: ['missing-assets'],
                    operations: [
                        {
                            _op: 'missing-assets-reader',
                        },
                        {
                            _op: 'missing-assets-op',
                        }
                    ]
                });

                executionContext = new ExecutionContext(testContext.context, testContext.config);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should reject with a error', () => {
                const errMsg = 'asset: missing-assets was not found';
                return expect(executionContext.initialize()).rejects.toThrowError(errMsg);
            });
        });

        describe('when using assets and the fail on require', () => {
            let executionContext;
            let testContext;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    assets: ['failing-asset'],
                    operations: [
                        {
                            _op: 'failing-asset-reader',
                        }
                    ]
                });

                await testContext.saveAsset(path.join(opsPath, 'failing-asset'));

                executionContext = new ExecutionContext(testContext.context, testContext.config);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should reject with a error', () => {
                const errMsg = new RegExp('Could not retrieve code for: failing-asset-reader');
                return expect(executionContext.initialize()).rejects.toThrowError(errMsg);
            });
        });
    });
});
