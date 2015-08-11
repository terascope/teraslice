// function to create a kafkaesque instance

function consumer(context, opConfig, partition) {
    var client = context.kafka.default;
    var kafka = require('kafka-node');

    var topics = [{
        topic: opConfig.topic, 
        partition: partition
    }];

    var options = { 
        autoCommit: true, 
        fetchMaxWaitMs: 1000, 
        fetchMaxBytes: opConfig.size, 
        groupId: opConfig.group 
    };

    return new kafka.Consumer(client, topics, options);
}

function offset(context, opConfig) {
    var client = context.kafka.default;
    var kafka = require('kafka-node');
    
    return new kafka.Offset(client);
}

module.exports = {
    consumer: consumer,
    offset: offset
}
