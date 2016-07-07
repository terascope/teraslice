'use strict';

var Promise = require('bluebird');

/*
This will be a router that will take an incoming data stream and split it based on
keys to go into multiple locations. connection_map will define the mapping of
where the data needs to go.

Ultimately the functionality of this should probably be split and included as options
to elasticsearch_index_selector and elasticsearch_bulk
*/
function newSender(context, opConfig, jobConfig) {
    var logger = jobConfig.logger;

    var multi_context = require('./multi_context')(context, opConfig);

    return function(data) {
        return new Promise(function(resolve, reject) {
            var activeQueues = multi_context.prepareQueues();

            var update = [];

            var dataArray;
            if (data.hits && data.hits.hits) {
                dataArray = data.hits.hits
            } else {
                dataArray = data;
            }

            var bulkQueue;
            dataArray.forEach(function(record) {
                var key = record._id;

                var indexName = opConfig.index;
                if (opConfig.connection_map) {
                    indexName = opConfig.index + "-" + key[0];
                }

                bulkQueue = activeQueues[key[0]];

                // TODO: should support many actions here.
                bulkQueue.push({
                    index: {
                        _index: indexName,
                        _type: opConfig.type,
                        _id: key
                    }
                });

                bulkQueue.push(record._source);
            })

            multi_context
                .queueAll(activeQueues)
                .then(function(requests) {
                    var counter = 0;
                    Promise.each(requests, function(count) {
                        counter += count;
                    })
                    .then(function() {
                        // TODO: find out why this is isn't showing correctly in the logs
                        resolve(counter);
                    })
                });
        });
    }
}

function schema() {
    // options: type, index, connection_map
    return {
/*        path: {
            doc: 'path to directory where the data will be saved to, directory must pre-exist',
            default: null,
            format: 'required_String'
        },
        elastic_metadata: {
            doc: 'set to true if you would like to save the metadata of the doc to file',
            default: false,
            format: Boolean
        }*/
    };
}

module.exports = {
    newSender: newSender,
    schema: schema
};