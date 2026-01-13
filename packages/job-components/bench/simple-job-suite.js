import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExecutedFile } from '@terascope/core-utils';
import { Suite } from '@terascope/core-utils/bench/helpers.js';
import { TestContext, newTestExecutionConfig, WorkerExecutionContext } from '../dist/src/index.js';
import SimpleFetcher from './fixtures/simple-reader/fetcher.js';
import SimpleMap from './fixtures/simple-map/processor.js';
import SimpleFilter from './fixtures/simple-filter/processor.js';
import SimpleEach from './fixtures/simple-each/processor.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const context = new TestContext('simple-job-suite');
context.assignment = 'worker';
context.sysconfig.teraslice.assets_directory = dirname;

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
        terasliceOpPath: path.join(dirname, '..', '..', 'teraslice', 'lib'),
        context,
        executionConfig,
        assetIds: ['fixtures'],
    });

    await executionContext.initialize();

    return Suite('Simple Job (1000 records per op)')
        .add('methods without DataEntities', {
            defer: true,
            fn(deferred) {
                fetcher
                    .fetch({ addMetadata: true })
                    .then((result) => result.map((data) => map.map(data)))
                    .then((result) => {
                        result.forEach((data) => each.forEach(data));
                        return result;
                    })
                    .then((result) => result.filter((data) => filter.filter(data)))
                    .then((result) => {
                        result.forEach((data) => each.forEach(data));
                        return result;
                    })
                    .then(() => deferred.resolve());
            },
        })
        .add('methods with DataEntities', {
            defer: true,
            fn(deferred) {
                fetcher
                    .fetch({ precreate: true })
                    .then((result) => result.map((data) => map.map(data)))
                    .then((result) => {
                        result.forEach((data) => each.forEach(data));
                        return result;
                    })
                    .then((result) => result.filter((data) => filter.filter(data)))
                    .then((result) => {
                        result.forEach((data) => each.forEach(data));
                        return result;
                    })
                    .then(() => deferred.resolve());
            },
        })
        .add('handle with precreated DataEntities', {
            defer: true,
            fn(deferred) {
                fetcher
                    .handle({ precreate: true })
                    .then((result) => map.handle(result))
                    .then((result) => each.handle(result))
                    .then((result) => filter.handle(result))
                    .then((result) => each.handle(result))
                    .then(() => deferred.resolve());
            },
        })
        .add('handle with automatic DataEntities', {
            defer: true,
            fn(deferred) {
                fetcher
                    .handle()
                    .then((result) => map.handle(result))
                    .then((result) => each.handle(result))
                    .then((result) => filter.handle(result))
                    .then((result) => each.handle(result))
                    .then(() => deferred.resolve());
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

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
