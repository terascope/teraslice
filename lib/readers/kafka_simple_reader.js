'use strict';

var Promise = require("bluebird");
var op = 'kafka_simple_reader';

function newReader(context, opConfig, jobConfig) {
    var logger = jobConfig.logger;

    // TODO validation of opConfig settings

    return function(partition) {
        var consumer = require('../utils/kafka').consumer(context, opConfig, partition);
        var offset = require('../utils/kafka').offset(consumer);

        return new Promise(function(resolve, reject) {
            offset.fetchCommits(opConfig.group, [{
                topic: opConfig.topic,
                partition: partition
            }], function(err, offsets) {
                var result = [];

                var paused = false;

                var expected;

                var starting = offsets[opConfig.topic][partition] === -1 ? 0 : offsets[opConfig.topic][partition];
                consumer.setOffset(opConfig.topic, partition, starting);

                // We have to wait for all the messages to accumulate before
                // resolve can be called.
                var interval = setInterval(function() {
                    if (paused) {
                        var resultsExpected = expected - starting;
                        if (resultsExpected < 0) {
                            logger.error("ERROR: detected offset reset. Attempting to correct.");
                            logger.error("Starting " + starting + " expect " + expected + " for part " + partition + " got " + result.length + " need " + (expected - starting)) ;

                            consumer.setOffset(opConfig.topic, partition, starting);
                            resultsExpected = expected;
                        }

                        if (resultsExpected === (result.length)) {
                            clearInterval(interval);

                            consumer.close(true, function() {
                                logger.info("Resolving with " + result.length + " results for partition " + partition);

                                resolve(result);
                            });
                        }
                    }
                }, 5);

                consumer.on('message', function(message) {
                    if (message.value) {
                        result.push(JSON.parse(message.value));
                    }
                });

                consumer.on('done', function(message) {
                    // The consumer is paused after a chunk of data is downloaded.
                    // messages will accumulate until we have them all. 'done' can
                    // be called before all messages are delivered.
                    consumer.pause();

                    // I don't like this +1 here but it's always off.
                    expected = (message[opConfig.topic][partition] + 1) || starting;
                    paused = true;
                });

                consumer.on('error', function(err) {
                    logger.error(err);
                    reject(err);
                });

                var init = setInterval(function() {
                    if (consumer.ready) {
                        clearInterval(init);
                        consumer.resume();
                    }
                }, 1);

                /*
                 * If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
                 */
                consumer.on('offsetOutOfRange', function(topic) {
                    offset.fetch([{
                        topic: opConfig.topic,
                        partition: partition,
                        time: -2 // Special time meaning earliest offset available
                    }], function(err, offsets) {
                        var offset = offsets[opConfig.topic][partition];
                        logger.info("Offset out of range. Resetting offset to latest position: " + offset + " for partition " + partition);

                        consumer.setOffset(opConfig.topic, partition, offset);
                    });
                });
            });
        });
    }
}

function newSlicer(context, opConfig, jobConfig) {
    var logger = jobConfig.logger;

    var partitions = [];

    // If it's a range, we're only interested in that set of partitions
    if ((typeof opConfig.partitions === "string") && opConfig.partitions.indexOf('-') > 0) {
        var pieces = opConfig.partitions.split('-');
        var start = pieces[0];
        var end = pieces[1];

        for (var i = start; i <= end; i++) partitions.push(i);
    }
    // If we aren't given a list of partitions, convert the number into an array.
    else if (! Array.isArray(opConfig.partitions)) {
        for (var i = 0; i < opConfig.partitions; i++) partitions.push(i);
    }
    else {
        partitions = opConfig.partitions;
    }

    // The slicer just returns a single partition number from the list.
    return function(completed) {
        if ((completed.slice !== undefined) && (jobConfig.lifecycle === 'persistent')) {
            partitions.push(completed.slice);
        }

        return partitions.shift();
    }
}

function schema(){
    return {
        partitions:{
            doc: 'What partitions to process. Can be a number or an array. As a number defines how many partitions exist and all will be processed. An array defines a specific set of partitions to process.',
            default: '',
            format: function(value) {
                if ((typeof value !== "number") && (! Array.isArray(value.partitions)) && ( ! value.indexOf('-') > 0)) {
                    throw new Error("partitions must either be a number, an array of numbers or a range ex: 2-10.");
                }
            }
        },
        topic: {
            doc: 'Name of the Kafka topic to process',
            default: '',
            format: 'required_String'
        },
        group: {
            doc: 'Name of the Kafka consumer group',
            default: '',
            format: 'required_String'
        },
        size: {
            doc: 'How large of a chunk to read from Kafka. Specified in bytes.',
            default: 1024000,
            format: Number
        },
        wait: {
            doc: 'How long to wait for a full chunk of data to be available. Specified in milliseconds.',
            default: 100,
            format: Number
        }
    };
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema
};
