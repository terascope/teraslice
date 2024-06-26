export default {
    name: 'generator',
    slicers: 1,
    lifecycle: 'persistent',
    workers: 3,
    analytics: false,
    assets: ['standard'],
    max_retries: 0,
    operations: [
        {
            _op: 'data_generator',
            size: 1000,
            stress_test: false
        },
        {
            _op: 'noop'
        }
    ]
};
