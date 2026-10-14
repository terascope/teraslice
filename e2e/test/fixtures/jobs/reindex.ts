import { config } from '../../config.js';

export default {
    name: 'Reindex',
    lifecycle: 'once',
    workers: 1,
    analytics: true,
    assets: ['elasticsearch'],
    apis: [
        {
            _name: 'elasticsearch_reader_api',
            _connection: config.OS_CONNECTION,
            index: 'replace-me-100',
            size: 100,
            date_field_name: 'created',
        },
        {
            _name: 'elasticsearch_sender_api',
            _connection: config.OS_CONNECTION,
            index: 'replace-me-1000',
            size: 50
        }
    ],
    operations: [
        {
            _op: 'elasticsearch_reader',
            _api_name: 'elasticsearch_reader_api'

        },
        {
            _op: 'elasticsearch_bulk',
            _api_name: 'elasticsearch_sender_api'
        }
    ]
};
