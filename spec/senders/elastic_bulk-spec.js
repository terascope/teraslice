'use strict';

var es_sender = require('../../lib/senders/elasticsearch_bulk');

describe('elasticsearch_bulk', function() {

    it('has both a newSender and schema method', function() {

        expect(es_sender.newProcessor).toBeDefined();
        expect(es_sender.schema).toBeDefined();
        expect(typeof es_sender.newProcessor).toEqual('function');
        expect(typeof es_sender.schema).toEqual('function');

    });

    it('schema has defaults', function() {
        var defaults = es_sender.schema();

        expect(defaults.size).toBeDefined();
        expect(defaults.size.default).toEqual(500);

    });

});

