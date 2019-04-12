'use strict';

const path = require('path');
const { Suite } = require('../../utils/bench/helpers');
const {
    TestContext,
    newTestExecutionConfig,
    WorkerExecutionContext
} = require('../dist/src');

const context = new TestContext('simple-job-suite');
context.assignment = 'worker';
context.sysconfig.teraslice.assets_directory = __dirname;

const executionConfig = newTestExecutionConfig();
executionConfig.analytics = false;
executionConfig.assets = ['fixtures'];
executionConfig.operations = [
    {
        _op: 'simple-reader',
    },
    {
        _op: 'simple-each',
    },
];

const run = async () => {
    const executionContext = new WorkerExecutionContext({
        terasliceOpPath: path.join(__dirname, '..', '..', 'teraslice', 'lib'),
        context,
        executionConfig,
        assetIds: ['fixtures'],
    });

    await executionContext.initialize();

    return Suite('Worker LifeCycle Job')
        .add('onSliceInitialized', {
            defer: true,
            fn(deferred) {
                executionContext
                    .onSliceInitialized('123')
                    .then(() => deferred.resolve());
            }
        })
        .add('onSliceSuccess', {
            defer: true,
            fn(deferred) {
                executionContext
                    .onSliceStarted('123')
                    .then(() => deferred.resolve());
            }
        })
        .add('onSliceFailure', {
            defer: true,
            fn(deferred) {
                executionContext
                    .onSliceFailed('123')
                    .then(() => deferred.resolve());
            }
        })
        .add('onSliceRetry', {
            defer: true,
            fn(deferred) {
                executionContext
                    .onSliceRetry('123')
                    .then(() => deferred.resolve());
            }
        })
        .add('onSliceFinalizing', {
            defer: true,
            fn(deferred) {
                executionContext
                    .onSliceFinalizing('123')
                    .then(() => deferred.resolve());
            }
        })
        .add('onSliceFinished', {
            defer: true,
            fn(deferred) {
                executionContext
                    .onSliceFinished('123')
                    .then(() => deferred.resolve());
            }
        })
        .add('onOperationStart', {
            fn() {
                executionContext
                    .onOperationStart('123', 0);
            }
        })
        .add('onOperationComplete', {
            fn() {
                executionContext
                    .onOperationComplete('123', 0, 100);
            }
        })
        .run({
            async: true,
            initCount: 1,
            maxTime: 3,
        });
};

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
