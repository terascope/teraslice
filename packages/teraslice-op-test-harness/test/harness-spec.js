'use strict';

const opHarness = require('../index');
const opFoo = require('./legacy-processors/foo');
const opEvents = require('./legacy-processors/events');
const reader = require('./legacy-processors/reader');
const Processor = require('./operations/example-op/processor');
const ProcessorSchema = require('./operations/example-op/schema');
const Fetcher = require('./operations/example-reader/fetcher');
const Slicer = require('./operations/example-reader/slicer');
const ReaderSchema = require('./operations/example-reader/schema');

describe('With no op config', () => {
    it('it runs successfully', () => {
        const harness = opHarness(opFoo);
        const results = harness.run([{}]);
        expect(results.length).toEqual(1);
        expect(results[0].foo).toEqual('foo');
    });
});

describe('With multiple jobs', () => {
    it('first job runs', () => {
        const harness = opHarness(opFoo);
        const results = harness.run([{}], { field: 'yeee' });
        expect(results.length).toEqual(1);
        expect(results[0].yeee).toEqual('foo');
    });
    it('second job config not influenced by the first', () => {
        const harness = opHarness(opFoo);
        const results = harness.run([{}], {});
        expect(results.length).toEqual(1);
        expect(results[0].foo).toEqual('foo');
        expect(results[0].yeee).toBeUndefined();
    });
});


describe('With event callbacks', () => {
    it('it runs successfully', (done) => {
        const harness = opHarness(opEvents);
        harness.runSlices([[{ }]], {
            eventName: 'worker:shutdown'
        }).then((results) => {
            expect(results[1]).toEqual(1);
            done();
        }).catch(fail);
    });
});


describe('With multiple slices', () => {
    it('it runs successfully', (done) => {
        const harness = opHarness(opFoo);
        harness.runSlices([[{ }], [{ }]])
            .then((results) => {
                expect(results.length).toEqual(3);
                expect(results[0]).toEqual([{ foo: 'foo' }]);
                expect(results[1]).toEqual([{ foo: 'foo' }]);
                expect(results[2]).toEqual([]);
                done();
            }).catch(fail);
    });
});

// Any test above this line is for backward compatability
describe('tests for new op harness', () => {
    class Client {
        async get(data) {
            data.wasFetched = true;
            return data;
        }

        async count(data) {
            data.count = 5;
            return data;
        }
    }

    it('can instantiate and return methods', () => {
        const opTest = opHarness(reader);

        expect(opTest).toBeDefined();
        expect(opTest.init).toBeDefined();
        expect(typeof opTest.init).toEqual('function');

        expect(opTest.processData).toBeDefined();
        expect(typeof opTest.processData).toEqual('function');

        expect(opTest.context).toBeDefined();
        expect(opTest.schema).toBeDefined();
        expect(opTest.operationFn).toEqual(reader);
    });

    it('can init and return a new instance of op', async () => {
        const opTest = opHarness(opFoo);
        const opConfig = { _op: 'foo', some: 'config' };
        const test = await opTest.init({ opConfig });

        expect(test).toBeDefined();
        expect(test.opConfig).toEqual({ _op: 'foo', field: 'foo', some: 'config' });
        expect(test.operation).toBeDefined();
        expect(test.isProcessor).toEqual(true);

        const results = await test.run([{}]);
        expect(results).toEqual([{ foo: 'foo' }]);
    });

    it('has a shorthand to init and call data on ops', async () => {
        const opTest = opHarness(opFoo);
        const opConfig = { _op: 'foo', some: 'config' };
        const results = await opTest.processData(opConfig, [{}]);
        expect(results).toEqual([{ foo: 'foo' }]);

        const results2 = await opTest.processData(opConfig, [{}, {}]);
        expect(results2).toEqual([{ foo: 'foo' }, { foo: 'foo' }]);
    });

    it('can work with readers', async () => {
        const opTest = opHarness(reader);
        const client = new Client();
        const type = 'reader';
        const executionConfig = { lifecycle: 'once', operations: [{ _op: 'reader' }] };
        opTest.setClients([{ client, type: 'elasticsearch' }]);
        const test = await opTest.init({ executionConfig, type });

        const results = await test.run({ test: 'data' });
        expect(results).toEqual([{ test: 'data', wasRead: true, wasFetched: true }]);
    });

    it('can work with slicers', async () => {
        const opTest = opHarness(reader);
        const client = new Client();
        const executionConfig = { lifecycle: 'once', operations: [{ _op: 'reader' }] };
        opTest.setClients([{ client, type: 'elasticsearch' }]);

        const test = await opTest.init({ executionConfig });
        const [results] = await test.run({ fullSlice: true });

        expect(results).toBeDefined();
        expect(results.request.count).toEqual(5);
        expect(results.request.now instanceof Date).toEqual(true);

        const [request] = await test.run();

        expect(request.count).toEqual(5);
        expect(request.now instanceof Date).toEqual(true);
    });
});

describe('op harness can handle new style procossors/readers/slicers', () => {
    it('can load a operation', async () => {
        const opTest = opHarness({ Processor, Schema: ProcessorSchema });
        const opConfig = { _op: 'example-op', some: 'config' };
        const test = await opTest.init({ opConfig });

        const [results] = await test.run([{}]);
        const time = new Date(results.touchedAt).getTime();

        expect(results.touchedAt).toBeDefined();
        expect(typeof results.touchedAt).toEqual('string');
        expect(isNaN(time)).toEqual(false);
    });

    it('can load a Fetcher', async () => {
        const opTest = opHarness({ Fetcher, Schema: ReaderSchema });
        const opConfig = { _op: 'example-reader', some: 'config' };
        const test = await opTest.init({ opConfig });

        const results = await test.run([{}]);

        expect(results).toBeDefined();
        expect(results.length).toEqual(10);
        expect(results[0].id).toEqual(0);
        expect(results[0].data.length).toEqual(3);
    });

    it('can load a Slicer', async () => {
        const opTest = opHarness({ Slicer, Schema: ReaderSchema });
        const opConfig = { _op: 'example-reader', some: 'config' };
        const test = await opTest.init({ opConfig });

        const [results] = await test.run({ fullSlice: true });

        expect(results).toBeDefined();
        expect(results.slicer_id).toEqual(0);
        expect(results.slicer_order).toEqual(1);
        expect(results.request.fetchFrom).toEqual('https://httpstat.us/200');

        const [request] = await test.run();

        expect(request.fetchFrom).toEqual('https://httpstat.us/200');
    });
});
