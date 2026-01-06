export default {
    name: 'Kafka Reader',
    lifecycle: 'persistent',
    workers: 1,
    analytics: true,
    assets: ['kafka', 'elasticsearch'],
    max_retries: 0,
    operations: [
        {
            _op: 'kafka_reader',
            connection: 'default',
            topic: 'replace-me-1000',
            group: 'example-kafka-group',
            size: 300,
            wait: 500,
            _encoding: 'json'
        },
        {
            _op: 'elasticsearch_bulk',
            index: 'replace-me-1000',
            size: 500
        }
    ]
};
