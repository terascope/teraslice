/* eslint-disable no-console */
import { TerasliceClient } from 'teraslice-client-js';

const client = new TerasliceClient({
    host: 'http://localhost:5678'
});

const exampleJob = {
    name: 'Data Generator',
    lifecycle: 'once',
    workers: 1,
    assets: ['elasticsearch', 'standard'],
    apis: [
        {
            _name: 'elasticsearch_sender_api',
            index: 'client-test-logs',
            type: 'events',
            size: 50
        }
    ],
    operations: [
        {
            _op: 'data_generator',
            size: 1
        },
        {
            _op: 'elasticsearch_bulk',
            _api_name: 'elasticsearch_sender_api'
        }
    ]
};

async function main() {
    const job = await client.jobs.submit(exampleJob);

    console.log(job.id());

    const job2 = client.jobs.wrap(job.id());
    const status = await job2.status();

    console.log(status);

    console.log('Waiting for the job to finish.');
    await job2.waitForStatus('completed');
    console.log('Job completed');
}

main();
