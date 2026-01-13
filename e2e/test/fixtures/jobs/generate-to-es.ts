export default {
    name: 'generator',
    slicers: 1,
    lifecycle: 'persistent',
    workers: 2,
    analytics: false,
    assets: ['elasticsearch', 'standard'],
    max_retries: 0,
    apis: [
        {
            _name: 'elasticsearch_sender_api',
            index: 'replace-me-1000',
            size: 1000
        }
    ],
    operations: [
        {
            _op: 'data_generator',
            size: 100
        },
        {
            _op: 'elasticsearch_bulk',
            _api_name: 'elasticsearch_sender_api'
        }
    ]
};
