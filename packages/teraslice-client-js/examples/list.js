'use strict';

/* eslint-disable no-console */

const teraslice = require('../index')({
    host: 'http://localhost:5678'
});

teraslice.jobs.list().then(console.log);

teraslice.ex.list('completed').then(console.log);

teraslice.ex.list('running').then(console.log);

teraslice.ex.list('pending').then(console.log);
