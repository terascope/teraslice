export default {
    name: 'Kafka Sender',
    lifecycle: 'once',
    workers: 1,
    analytics: true,
    assets: ['kafka', 'elasticsearch'],
    max_retries: 0,
    operations: [
        {
            _op: 'elasticsearch_reader',
            index: 'replace-me-1000',
            type: 'events',
            size: 500,
            date_field_name: 'created',
            preserve_id: true
        },
        {
            _op: 'kafka_sender',
            connection: 'default',
            topic: 'replace-me-1000',
            size: 100,
            timestamp_field: 'created',
            _encoding: 'json'
        }
    ]
};
