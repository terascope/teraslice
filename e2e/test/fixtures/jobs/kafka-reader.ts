import { config } from '../../config.js';

export default {
    name: 'Kafka Reader',
    lifecycle: 'persistent',
    workers: 1,
    analytics: true,
    assets: ['kafka', 'elasticsearch'],
    max_retries: 0,
    apis: [
        {
            _name: 'kafka_reader_api',
            _connection: 'default',
            topic: 'replace-me-1000',
            group: 'example-kafka-group',
            size: 300,
            wait: 500,
            _encoding: 'json'
        },
        {
            _name: 'elasticsearch_sender_api',
            _connection: config.OS_CONNECTION,
            index: 'replace-me-1000',
            size: 500
        }
    ],
    operations: [
        {
            _op: 'kafka_reader',
            _api_name: 'kafka_reader_api',
        },
        {
            _op: 'elasticsearch_bulk',
            _api_name: 'elasticsearch_sender_api'
        }
    ]
};
