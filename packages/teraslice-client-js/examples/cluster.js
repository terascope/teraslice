'use strict';

/* eslint-disable no-console */

const teraslice = require('../index')({
    host: 'http://localhost:5678'
});

teraslice.cluster.state().then(console.log);

teraslice.cluster.slicers().then(console.log);
