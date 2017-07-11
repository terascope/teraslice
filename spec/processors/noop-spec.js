'use strict';

var processor = require('../../lib/processors/noop');

describe('noop processor', function() {
    it('has a schema and newProcessor method', function() {
        expect(processor).toBeDefined();
        expect(processor.newProcessor).toBeDefined();
        expect(processor.schema).toBeDefined();
        expect(typeof processor.newProcessor).toEqual('function');
        expect(typeof processor.schema).toEqual('function');
    });
});

describe('The data remains unchanged when', function() {
    var context = {};
    var opConfig = {};
    var jobConfig = {logger: 'im a fake logger'};

    var myProcessor = processor.newProcessor(
        context,
        opConfig,
        jobConfig);
    it('using empty data array', function() {
        // zero elements
        expect(myProcessor([])).toEqual([]);
    });
    it('using simple data array', function() {
        // zero elements
        var data = [
            {'a': 1},
            {'a': 2},
            {'a': 3}
        ];
        expect(myProcessor(data)).toEqual(data);
    });
});
