'use strict';

/* eslint-disable no-console */

const teraslice = require('../index')({
    host: 'http://localhost:5678'
});

const exampleJob = {
    name: 'Data Generator',
    lifecycle: 'once',
    workers: 1,
    operations: [
        {
            _op: 'elasticsearch_data_generator',
            size: 1
        },
        {
            _op: 'elasticsearch_index_selector',
            index: 'client-test-logs',
            type: 'events'
        },
        {
            _op: 'elasticsearch_bulk',
            size: 50
        }
    ]
};

teraslice.jobs.submit(exampleJob)
    .then((job) => {
        console.log(job.id());

        const job2 = teraslice.jobs.wrap(job.id());
        job2.status().then(console.log);

        console.log('Waiting for the job to finish.');
        job2.waitForStatus('completed')
            .then(() => {
                console.log('Job completed');
            });
    });
