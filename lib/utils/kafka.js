var kafka = require('kafka-node');
var getClient = require('./config').getClient;


function producer(context, opConfig) {
    var client = getClient(context, opConfig, 'kafka');

    return new kafka.Producer(client, { requireAcks: 1 });
}

function consumer(context, opConfig, partition) {
    var client = getClient(context, opConfig, 'kafka');

    var topics = [{
        topic: opConfig.topic,
        partition: partition
    }];

    var options = {
        autoCommit: true,
        fetchMaxWaitMs: opConfig.wait,
        fetchMaxBytes: opConfig.size,
        groupId: opConfig.group,
        paused: true
    };

    return new kafka.Consumer(client, topics, options);
}

function offset(consumer) {
    return new kafka.Offset(consumer.client);
}

module.exports = {
    producer: producer,
    consumer: consumer,
    offset: offset
};
