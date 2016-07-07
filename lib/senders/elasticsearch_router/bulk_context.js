'use strict';
var Promise = require('bluebird');

var DOCUMENT_UPDATED = 200;
var DOCUMENT_CREATED = 201;
var DOCUMENT_EXISTS = 409;

module.exports = function(context, opConfig, connection) {
    var logger = context.logger;

    var client = context.foundation.getConnection({
            endpoint: connection,
            type: 'elasticsearch',
            cached: true
        }).client;

    var bulk_size = 1000;
    if (opConfig.size) bulk_size = opConfig.size;

    var activeBulk = [];
    var activeCount = 0;
    var runningBulk = 0;

    // We flush periodically to make sure we don't end up with data languishing
    // in a buffer that is not actively being written to.
    /*var cacheFlusher = setInterval(function() {
        if (activeBulk.length > 0) {
            logger.info("Flushing bulk cache.");

            var bulkSave = activeBulk;
            activeBulk = [];

            _flush(bulkSave);
        }
    }, 30000);*/

    function _flush(bulkSave) {

        return new Promise(function(resolve, reject) {
            runningBulk++;
            logger.info("Flushing " + (bulkSave.length / 2) + " records.")
            client.bulk({
                body: bulkSave
            }, function(err, resp) {
                activeCount += bulkSave.length / 2;

                runningBulk--;

                if (err) {
                    logger.error("Router save general error: " + err);
                }
                else {
                    resp.items.forEach(function(item, index) {
                        if (item.create) {
                            if (item.create.status == DOCUMENT_CREATED) {

                            }
                            // 409 is document already exists which is expected if we already know about the record
                            else if (item.create.status != DOCUMENT_EXISTS) {
                                logger.error("Save error from bulk insert: " + item.create.status + " " + item.create.error);
                            }
                        }
                    });

                    logger.info('Total processed ' + activeCount);
                }

                resolve(activeCount);
            });
        });
    }

    function _sync() {
        if (activeBulk.length >= bulk_size) {
            var bulkSave = activeBulk;
            activeBulk = [];

            return _flush(bulkSave);
        }

        return Promise.resolve(0);
    }

    function queue(metadata, record) {
        activeBulk.push(metadata);
        activeBulk.push(record);
        return flush();
    }

    function queueAll(bulk) {
        // Merge the arrays without creating an entirely new array.
        Array.prototype.push.apply(activeBulk, bulk);

        return flush();
    }

    function flush() {
        if (activeBulk.length > 0) {
            var bulkSave = activeBulk;
            activeBulk = [];

            return _flush(bulkSave);
        }

        return Promise.resolve(0);
    }

    return {
        queue: queue,
        queueAll: queueAll,
        flush: flush
    };
}