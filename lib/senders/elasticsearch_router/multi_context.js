'use strict';

var Promise = require('bluebird');

module.exports = function(context, opConfig) {
    var logger = context.logger;

    var bulk_contexts = {};
    var single_context;

    // If there's a connection_map then we're dealing with a set of connections
    // otherise there is just one.
    if (opConfig.connection_map) {
        _prepareContexts();
    }
    else {
        single_context = require('./bulk_context')(context,
            opConfig, opConfig.connection);
    }

    function prepareQueues() {
        if (! single_context) {
            var queues = {};
            for (var key in bulk_contexts) {
                queues[key] = [];
            }

            return queues;
        }

        // If there's no connection_map then we just need a single queue
        return [];
    }

    function _prepareContexts() {
        var connection_map = opConfig.connection_map;

        // We create a bulk context for each keyset then map individual keys
        // to the bulk context for their keyset.
        for (var keyset in connection_map) {
            var bulk = require('./bulk_context')(context,
                opConfig, connection_map[keyset]);

            var keys = keyset.split(',');
            for (var i = 0; i < keys.length; i++) {
                bulk_contexts[keys[i].toLowerCase()] = bulk;
            }
        }
    }

    function queueAll(activeQueues) {
        if (single_context) {
            return single_context.queueAll(activeQueues);
        }
        else {
            var results = [];
            for (var key in activeQueues) {
                if (activeQueues[key].length > 0) {
                    results.push(bulk_contexts[key].queueAll(activeQueues[key]))
                }
            }

            return Promise.all(results);
        }
    }

    function flush() {
        var flushing = [];
        for (var key in bulk_contexts) {
            flushing.push(bulk_contexts[key].flush());
        }

        return Promise.all(flushing);
    }

    return {
        prepareQueues: prepareQueues,
        queueAll: queueAll,
        flush: flush
    }
}