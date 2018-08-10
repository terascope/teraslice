'use strict';

/* eslint-disable no-console */

const teraslice = require('../index')({
    host: 'http://localhost:5678'
});

teraslice.jobs.list().then(console.log);

teraslice.jobs.list('completed').then(console.log);

teraslice.jobs.list('running').then(console.log);

teraslice.jobs.list('pending').then(console.log);
