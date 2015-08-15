var kafka = require('kafka-node');

function createClient(context) {
    var config = context.sysconfig;

    return new kafka.Client(config.kafka.default.zookeepers, config.kafka.default.clientId);
}

function producer(context, opConfig) {
    var client = createClient(context);

    return new kafka.Producer(client, { requireAcks: 1 });
}

function consumer(context, opConfig, partition) {
    var client = createClient(context);

    var topics = [{
        topic: opConfig.topic,
        partition: partition
    }];

    var options = {
        autoCommit: true,
        fetchMaxWaitMs: 1000,
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
