export default {
    name: 'Reindex',
    lifecycle: 'once',
    workers: 1,
    analytics: true,
    assets: ['elasticsearch'],
    operations: [
        {
            _op: 'elasticsearch_reader',
            index: 'replace-me-100',
            size: 100,
            date_field_name: 'created',
        },
        {
            _op: 'elasticsearch_bulk',
            index: 'replace-me-1000',
            size: 50
        }
    ]
};
