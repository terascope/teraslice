export default {
    name: 'ID_Reindex',
    lifecycle: 'once',
    analytics: true,
    slicers: 2,
    workers: 4,
    assets: ['elasticsearch'],
    apis: [
        {
            _name: 'elasticsearch_reader_api',
            index: 'replace-me-1000',
            size: 500,
            key_type: 'base64url'
        },
        {
            _name: 'elasticsearch_sender_api',
            index: 'test-id_reindex-1000',
            size: 200
        }
    ],
    operations: [
        {
            _op: 'id_reader',
            _api_name: 'elasticsearch_reader_api',
        },
        {
            _op: 'elasticsearch_bulk',
            _api_name: 'elasticsearch_sender_api'
        }
    ]
};
