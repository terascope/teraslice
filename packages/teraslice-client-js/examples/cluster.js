'use strict';

/* eslint-disable no-console */

const { TerasliceClient } = require('teraslice-client-js');

const client = new TerasliceClient({
    host: 'http://localhost:5678'
});

client.cluster.state().then(console.log);

client.cluster.controllers().then(console.log);
