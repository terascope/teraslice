'use strict';

/* eslint-disable no-console */

const { TerasliceClient } = require('teraslice-client-js');

const client = new TerasliceClient({
    host: 'http://localhost:5678'
});

const exampleJob = {
    name: 'Data Generator',
    lifecycle: 'once',
    workers: 1,
    assets: ['elasticsearch', 'standard'],
    operations: [
        {
            _op: 'data_generator',
            size: 1
        },
        {
            _op: 'elasticsearch_bulk',
            index: 'client-test-logs',
            type: 'events',
            size: 50
        }
    ]
};

client.jobs.submit(exampleJob)
    .then((job) => {
        console.log(job.id());

        const job2 = client.jobs.wrap(job.id());
        job2.status().then(console.log);

        console.log('Waiting for the job to finish.');
        job2.waitForStatus('completed')
            .then(() => {
                console.log('Job completed');
            });
    });
