'use strict';

const opHarness = require('../index');
const opFoo = require('./processors/foo');
const opEvents = require('./processors/events');
const reader = require('./processors/reader');

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
        // eslint-disable-next-line class-methods-use-this
        async get(data) {
            data.wasFetched = true;
            return data;
        }

        // eslint-disable-next-line class-methods-use-this
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
        expect(typeof test.operation).toEqual('function');
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
        expect(results).toEqual({ test: 'data', wasRead: true, wasFetched: true });
    });

    it('can work with slicers', async () => {
        const opTest = opHarness(reader);
        const client = new Client();
        const executionConfig = { lifecycle: 'once', operations: [{ _op: 'reader' }] };
        opTest.setClients([{ client, type: 'elasticsearch' }]);

        const test = await opTest.init({ executionConfig, client });

        const results = await test.run();
        expect(results).toBeDefined();
        expect(results.count).toEqual(5);
        expect(results.now instanceof Date).toEqual(true);
    });
});
