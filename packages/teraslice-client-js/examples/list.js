'use strict';

/* eslint-disable no-console */

const { Client } = require('teraslice-client-js');

const client = new Client({
    host: 'http://localhost:5678'
});

client.jobs.list().then(console.log);

client.ex.list('completed').then(console.log);

client.ex.list('running').then(console.log);

client.ex.list('pending').then(console.log);
