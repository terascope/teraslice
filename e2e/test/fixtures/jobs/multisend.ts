export default {
    name: 'Multisend Test',
    workers: 1,
    lifecycle: 'once',
    analytics: false,
    assets: ['elasticsearch'],
    operations: [
        {
            _op: 'elasticsearch_reader',
            index: 'replace-me-1000',
            preserve_id: true,
            date_field_name: 'created',
            type: 'change',
            size: 500
        },
        {
            _op: 'elasticsearch_bulk',
            index: 'multisend-1000',
            preserve_id: true,
            type: 'change',
            multisend_index_append: false,
            size: 100,
            multisend: true,
            connection_map: {
                A: 'default',
                B: 'default',
                '*': 'default'
            }
        }
    ]
};
