'use strict';

describe('With no op config', () => {
    const harness = require('../index')(require('./processors/foo'));
    it('it runs successfully', () => {
        const results = harness.run([{}]);
        expect(results.length).toEqual(1);
        expect(results[0].foo).toEqual('foo');
    });
});


describe('With multiple jobs', () => {
    const harness = require('../index')(require('./processors/foo'));
    it('first job runs', () => {
        const results = harness.run([{}], { field: 'yeee' });
        expect(results.length).toEqual(1);
        expect(results[0].yeee).toEqual('foo');
    });
    it('second job config not influenced by the first', () => {
        const results = harness.run([{}], {});
        expect(results.length).toEqual(1);
        expect(results[0].foo).toEqual('foo');
        expect(results[0].yeee).toBeUndefined();
    });
});


describe('With event callbacks', () => {
    const harness = require('../index')(require('./processors/events'));
    it('it runs successfully', () => {
        const events = [];
        harness.runSlices([], { cb: i => events.push(i) })
            .then(() => {
                expect(events.length).toEqual(1);
                expect(events[0]).toEqual('worker:shutdown');
            });
    });
});


describe('With multiple slices', () => {
    const harness = require('../index')(require('./processors/foo'));
    it('it runs successfully', () => {
        harness.runSlices([[{ }], [{ }]])
            .then((results) => {
                expect(results.length).toEqual(3);
                expect(results[0]).toEqual([{ foo: 'foo' }]);
                expect(results[1]).toEqual([{ foo: 'foo' }]);
                expect(results[2]).toEqual([]);
            });
    });
});
