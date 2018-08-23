'use strict';

const _ = require('lodash');

const processor = require('../asset/tld-count');
const harness = require('@terascope/teraslice-op-test-harness')(processor);

const inputRecords = [
    {
        host: 'www.example.com'
    },
    {
        host: 'www.example.com'
    },
    {
        host: 'www.example.org'
    },
    {
        host: 'www.example.net'
    }
];

const opConfig = {
    field: 'host'
};

describe('reverse', () => {
    it('empty array should return empty array', () => {
        const results = harness.run([], opConfig);
        expect(results.length).toBe(0);
    });

    it('should count domains correctly', () => {
        const results = harness.run(_.cloneDeep(inputRecords), opConfig);
        expect(results.length).toBe(3);

        expect(results[0]._id).toBe('com');
        expect(results[0].count).toBe(2);
        expect(results[1]._id).toBe('org');
        expect(results[1].count).toBe(1);
        expect(results[2]._id).toBe('net');
        expect(results[2].count).toBe(1);
    });
});
