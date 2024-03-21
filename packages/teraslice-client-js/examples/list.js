/* eslint-disable no-console */

import { TerasliceClient } from 'teraslice-client-js';

const client = new TerasliceClient({
    host: 'http://localhost:5678'
});

const jobs = await client.jobs.list();
const executionsCompleted = await client.executions.list('completed');
const executionsRunning = await client.executions.list('running');
const executionsPending = await client.executions.list('pending');

console.dir({
    jobs, executionsCompleted, executionsRunning, executionsPending
}, { depth: 40 });
