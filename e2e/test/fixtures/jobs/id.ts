export default {
    name: 'ID_Reindex',
    lifecycle: 'once',
    analytics: true,
    slicers: 2,
    workers: 4,
    assets: ['elasticsearch'],
    operations: [
        {
            _op: 'id_reader',
            index: 'replace-me-1000',
            size: 500,
            key_type: 'base64url'
        },
        {
            _op: 'elasticsearch_bulk',
            index: 'test-id_reindex-1000',
            size: 200
        }
    ]
};
