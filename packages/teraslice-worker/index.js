'use strict';

global.Promise = require('bluebird');

const Worker = require('./lib/worker');
const ExecutionController = require('./lib/execution-controller');

module.exports = {
    Worker,
    ExecutionController
};
