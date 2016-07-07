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
    if (opConfig.bulk_size) bulk_size = opConfig.bulk_size;

    var activeBulk = [];
    var activeCount = 0;
    var runningBulk = 0;

    // We flush periodically to make sure we don't end up with data languishing
    // in a buffer that is not actively being written to.
    var cacheFlusher = setInterval(function() {
        if (activeBulk.length > 0) {
            logger.info("Flushing bulk cache.");

            var bulkSave = activeBulk;
            activeBulk = [];

            _flush(bulkSave);
        }
    }, 30000);

    function _flush(bulkSave) {

        return new Promise(function(resolve, reject) {
            runningBulk++;

            client.bulk({
                body: bulkSave
            }, function(err, resp) {
                activeCount += bulkSave.length / 2;

                //bulkSave = null;
                runningBulk--;

                if (err) {
                    logger.error("Detail save general error: " + err);
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
                        else if (item.update) {
                            if (item.update.status == DOCUMENT_CREATED) {

                            }
                            else if (item.update.status == DOCUMENT_UPDATED) {

                            }
                            // 409 is document already exists which is expected if we already know about the record
                            else if (item.update.status != DOCUMENT_EXISTS) {
                                logger.error("Save error from bulk update: " + item.update.status + " " + item.update.error);

                            }
                        }
                    });

                    logger.info('Total processed ' + activeCount);
                }

                resolve(true);
            });
        });
    }

    function _sync() {
        if (activeBulk.length >= bulk_size) {
            var bulkSave = activeBulk;
            activeBulk = [];

            return _flush(bulkSave);
        }

        return Promise.resolve(true);
    }

    function queue(metadata, record) {
        activeBulk.push(metadata);
        activeBulk.push(record);
        return _sync();
    }

    function queueAll(bulk) {
        // Merge the arrays without creating an entirely new array.
        Array.prototype.push.apply(activeBulk, bulk);

        return _sync();
    }

    function flush() {
        if (activeBulk.length > 0) {
            var bulkSave = activeBulk;
            activeBulk = [];

            return _flush(bulkSave);
        }

        return Promise.resolve(true);
    }

    return {
        queue: queue,
        queueAll: queueAll,
        flush: flush
    };
}