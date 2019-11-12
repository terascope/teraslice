'use strict';

/* eslint-disable no-console */

const { TerasliceClient } = require('teraslice-client-js');

const client = new TerasliceClient({
    host: 'http://localhost:5678'
});

client.jobs.list().then(console.log);

client.executions.list('completed').then(console.log);

client.executions.list('running').then(console.log);

client.executions.list('pending').then(console.log);
