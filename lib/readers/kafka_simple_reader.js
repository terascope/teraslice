'use strict';

var Promise = require("bluebird");

var op = 'kafka_simple_reader';

function newReader(context, opConfig) {
    var logger = context.logger;
    var client = context.kafka.default;
    
    // TODO verify parameters   
    
    return function(partition) {        
        var consumer = require('../utils/kafka').consumer(context, opConfig, partition);
        var offset = require('../utils/kafka').offset(context, opConfig);
      
        return new Promise(function(resolve, reject) {
            var result = new Array();

            offset.fetchCommits(opConfig.group, [{
                topic: opConfig.topic,
                partition: partition
            }], function(err, offset) {
                var paused = false;

                var expected;

                var starting = offset[opConfig.topic][partition];
                
                // We have to wait for all the messages to accumulate before 
                // resolve can be called.
                var interval = setInterval(function() {
                    if (paused) { 
                        if (expected - starting === (result.length)) {
                            logger.info("Resolving with " + result.length + " results for partition " + partition); 
                            resolve(result);
                            clearInterval(interval);                            
                        }
                    }                
                }, 5); 

                consumer.on('message', function (message) {
                    if (message.value) result.push(JSON.parse(message.value));                         
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

                consumer.on('error', function (err) {
                    logger.error(err);
                    reject(err);
                });

                /*      
                * If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
                */
                consumer.on('offsetOutOfRange', function (topic) {                
                    topic.maxNum = 2;
                    offset.fetch([topic], function (err, offsets) {                
                        var min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
                        consumer.setOffset(topic.topic, topic.partition, min);
                    });
                });
            });            
        });
    }
}

function newSlicer(context, opConfig) {
    var logger = context.logger;

    var partitions = [];
    
    if (! opConfig.partitions) {
        throw op + ": partitions is required.";
    }

    if ((typeof opConfig.partitions !== "number") && (! Array.isArray(opConfig.partitions))) {
        throw op + ": partitions must either be a number or a list of numbers.";
    }

    if (! opConfig.group) {
        throw op + ": group is required.";
    }

    // If we aren't given a list of partitions, convert the number into an array.
    if (! Array.isArray(opConfig.partitions)) {
        for (var i = 0; i < opConfig.partitions; i++) partitions.push(i); 
    }
    else {
        partitions = opConfig.partitions;
    }

    // The slicer just returns a single partition number from the list.
    return function() {   
        return partitions.pop();
    }
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer
};
