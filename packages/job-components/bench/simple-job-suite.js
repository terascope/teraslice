'use strict';

const path = require('path');
const { waterfall, isProd } = require('@terascope/utils');
const { Suite } = require('../../utils/bench/helpers');
const { TestContext, newTestExecutionConfig, WorkerExecutionContext } = require('../dist/src');

const SimpleFetcher = require('./fixtures/simple-reader/fetcher');
const SimpleMap = require('./fixtures/simple-map/processor');
const SimpleFilter = require('./fixtures/simple-filter/processor');
const SimpleEach = require('./fixtures/simple-each/processor');

const context = new TestContext('simple-job-suite');
context.assignment = 'worker';
context.sysconfig.teraslice.assets_directory = __dirname;

const executionConfig = newTestExecutionConfig();
const opConfig = { _op: 'benchmark' };

executionConfig.analytics = false;
executionConfig.assets = ['fixtures'];
executionConfig.operations = [
    {
        _op: 'simple-reader',
    },
    {
        _op: 'simple-map',
    },
    {
        _op: 'simple-each',
    },
    {
        _op: 'simple-filter',
    },
    {
        _op: 'simple-each',
    },
];

const fetcher = new SimpleFetcher(context, opConfig, executionConfig);
const each = new SimpleEach(context, opConfig, executionConfig);
const map = new SimpleMap(context, opConfig, executionConfig);
const filter = new SimpleFilter(context, opConfig, executionConfig);

const run = async () => {
    const executionContext = new WorkerExecutionContext({
        terasliceOpPath: path.join(__dirname, '..', '..', 'teraslice', 'lib'),
        context,
        executionConfig,
        assetIds: ['fixtures'],
    });

    await executionContext.initialize();

    return Suite('Simple Job (1000 records per op)')
        .add('methods without DataEntities', {
            defer: true,
            fn(deferred) {
                waterfall(
                    { addMetadata: true },
                    [
                        input => fetcher.fetch(input),
                        result => result.map(data => map.map(data)),
                        (result) => {
                            result.forEach(data => each.forEach(data));
                            return result;
                        },
                        result => result.filter(data => filter.filter(data)),
                        (result) => {
                            result.forEach(data => each.forEach(data));
                            return result;
                        },
                    ],
                    isProd
                ).then(() => deferred.resolve());
            },
        })
        .add('methods with DataEntities', {
            defer: true,
            fn(deferred) {
                waterfall(
                    { precreate: true },
                    [
                        input => fetcher.fetch(input),
                        result => result.map(data => map.map(data)),
                        (result) => {
                            result.forEach(data => each.forEach(data));
                            return result;
                        },
                        result => result.filter(data => filter.filter(data)),
                        (result) => {
                            result.forEach(data => each.forEach(data));
                            return result;
                        },
                    ],
                    isProd
                ).then(() => deferred.resolve());
            },
        })
        .add('handle with precreated DataEntities', {
            defer: true,
            fn(deferred) {
                waterfall(
                    { precreate: true },
                    [
                        input => fetcher.handle(input),
                        result => map.handle(result),
                        result => each.handle(result),
                        result => filter.handle(result),
                        result => each.handle(result),
                    ],
                    isProd
                ).then(() => deferred.resolve());
            },
        })
        .add('handle with automatic DataEntities', {
            defer: true,
            fn(deferred) {
                waterfall(
                    {},
                    [
                        input => fetcher.handle(input),
                        result => map.handle(result),
                        result => each.handle(result),
                        result => filter.handle(result),
                        result => each.handle(result),
                    ],
                    isProd
                ).then(() => deferred.resolve());
            },
        })
        .add('runSlice with precreated DataEntities', {
            defer: true,
            fn(deferred) {
                executionContext
                    .runSlice({
                        slice_id: '123',
                        slicer_id: 1,
                        slicer_order: 2,
                        request: { precreate: true },
                    })
                    .then(() => deferred.resolve());
            },
        })
        .add('runSlice with automatic DataEntities', {
            defer: true,
            fn(deferred) {
                executionContext
                    .runSlice({
                        slice_id: '123',
                        slicer_id: 1,
                        slicer_order: 2,
                        request: {},
                    })
                    .then(() => deferred.resolve());
            },
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
