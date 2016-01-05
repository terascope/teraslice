'use strict';

var es_sender = require('../../lib/senders/elasticsearch_bulk_insert');

describe('elasticsearch_bulk_insert', function() {

    it('has both a newSender and schema method', function() {

        expect(es_sender.newSender).toBeDefined();
        expect(es_sender.schema).toBeDefined();
        expect(typeof es_sender.newSender).toEqual('function');
        expect(typeof es_sender.schema).toEqual('function');

    });

    it('schema has defaults', function() {
        var defaults = es_sender.schema();

        expect(defaults.size).toBeDefined();
        expect(defaults.size.default).toEqual(5000);

    });

    it('newSender sends data to elasticsearch', function() {
        var client = {
            bulk: function() {
            }
        };
        var dataArray = [{one: 'data'}, {two: 'data'}, {three: 'data'}];

        var context = {
            foundation: {
                getConnection: function() {
                    return {
                        client: client
                    }
                }
            }
        };

        var opConfig = {size: 10};
        var jobConfig = {};

        spyOn(client, 'bulk');

        var sender = es_sender.newSender(context, opConfig, jobConfig);

        sender(dataArray);

        expect(typeof sender).toEqual('function');
        expect(client.bulk.calls.count()).toEqual(1);
        expect(client.bulk.calls.allArgs()).toEqual([[{body: dataArray}]]);

    });

});

