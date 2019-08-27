'use strict';

/* eslint-disable no-console */

const { Client } = require('teraslice-client-js');

const client = new Client({
    host: 'http://localhost:5678'
});

client.cluster.state().then(console.log);

client.cluster.controllers().then(console.log);
