export default {
    name: 'Kafka Sender',
    lifecycle: 'once',
    workers: 1,
    analytics: true,
    assets: ['kafka', 'elasticsearch'],
    max_retries: 0,
    apis: [
        {
            _name: 'elasticsearch_reader_api',
            index: 'replace-me-1000',
            size: 500,
            date_field_name: 'created',
        },
        {
            _name: 'kafka_sender_api',
            _connection: 'default',
            topic: 'replace-me-1000',
            size: 100,
            timestamp_field: 'created',
            _encoding: 'json'
        }
    ],
    operations: [
        {
            _op: 'elasticsearch_reader',
            _api_name: 'elasticsearch_reader_api',
        },
        {
            _op: 'kafka_sender',
            _api_name: 'kafka_sender_api',
        }
    ]
};
