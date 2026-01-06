export default {
    name: 'Multisend Test',
    workers: 1,
    lifecycle: 'once',
    analytics: false,
    assets: ['elasticsearch'],
    apis: [
        {
            _name: 'elasticsearch_reader_api',
            index: 'replace-me-1000',
            date_field_name: 'created',
            size: 500
        },
        {
            _name: 'elasticsearch_sender_api',
            index: 'multisend-1000',
            size: 100,
        }
    ],
    operations: [
        {
            _op: 'elasticsearch_reader',
            _api_name: 'elasticsearch_reader_api'
        },
        {
            _op: 'elasticsearch_bulk',
            _api_name: 'elasticsearch_sender_api',
            multisend_index_append: false,
            multisend: true,
            connection_map: {
                A: 'default',
                B: 'default',
                '*': 'default'
            }
        }
    ]
};
