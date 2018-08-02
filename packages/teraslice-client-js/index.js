'use strict';

const TerasliceClient = require('./lib');

// we don't want to break the existing api by forcing the client to be called with new
module.exports = function createTerasliceClient(config) {
    return new TerasliceClient(config);
};
