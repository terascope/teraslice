'use strict';

const jobConfig = JSON.stringify({
    name: 'Data Generator',
    lifecycle: 'once',
    analytics: false,
    operations: [
        {
            _op: 'elasticsearch_data_generator',
            size: 5000
        },
        {
            _op: 'elasticsearch_index_selector',
            index: 'bigdata5',
            type: 'events'
        },
        {
            _op: 'elasticsearch_bulk',
            size: 5000
        }
    ]
});

// used for get job
process.env.job = jobConfig;
