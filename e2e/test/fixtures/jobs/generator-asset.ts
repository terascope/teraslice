export default {
    name: 'generator-asset',
    slicers: 1,
    lifecycle: 'persistent',
    workers: 2,
    assets: ['ex1', 'standard'],
    max_retries: 0,
    analytics: false,
    operations: [
        {
            _op: 'data_generator',
            size: 1000
        },
        {
            _op: 'drop_property',
            property: 'userAgent'
        },
        {
            _op: 'delay',
            ms: 100
        }
    ]
};
