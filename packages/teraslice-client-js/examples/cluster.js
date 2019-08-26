'use strict';

/* eslint-disable no-console */

const teraslice = require('../dist/src/index')({
    host: 'http://localhost:5678'
});

teraslice.cluster.state().then(console.log);

teraslice.cluster.controllers().then(console.log);
