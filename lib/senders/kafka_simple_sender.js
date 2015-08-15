'use strict';

var Promise = require('bluebird');
var _ = require('lodash');

// TODO: this belongs someplace else
String.prototype.hashCode = function() {
    var hash = 0, i, chr, len;
    if (this.length == 0) return hash;

    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
};

function newSender(context, opConfig, jobConfig) {
    var logger = context.logger;

    function initializeBuckets() {
        return _.range(opConfig.partitions).map(function () { return [] });
    }

    return function(data) {
        //bulk throws an error if you send an empty array
        if (data.length === 0) {
            return Promise.resolve(null);
        }
        else {
            var producer = require('../utils/kafka').producer(context, opConfig);

            var saveBucket = function(partition, bucket) {
                return new Promise(function(resolve, reject) {
                    producer.send([{
                        topic: opConfig.topic,
                        partition: partition,
                        messages: bucket
                        //, attributes: 2
                    }], function (err, response) {
                        if (err) reject(err);
                        else resolve(response);
                    });
                })
            }

            // Divide the data up into partitions
            var buckets = initializeBuckets();

            data.forEach(function(item) {
                var partition = Math.abs(item[opConfig.key].hashCode() % opConfig.partitions);

                buckets[partition].push(JSON.stringify(item));
            });

            return new Promise(function(resolve, reject) {
                producer.on('ready', function() {
                    Promise.map(buckets, function(bucket, i) {
                        if (bucket.length > 0) return saveBucket(i, bucket);
                    })
                    .catch(function(err) {
                        logger.error("Error syncing to Kafka " + err)
                        reject(err);
                    })
                    .finally(function() {
                        producer.close();
                        resolve(null);
                    });
                });
            });
        }
    }
}

module.exports = {
    newSender: newSender
};