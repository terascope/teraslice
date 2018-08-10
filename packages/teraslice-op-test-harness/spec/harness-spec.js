'use strict';

const opHarness = require('../index');
const opFoo = require('./processors/foo');
const opEvents = require('./processors/events');

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
