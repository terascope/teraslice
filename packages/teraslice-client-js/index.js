'use strict';

module.exports = function(config) {
    var teraslice_host = config.host;

    return {
        jobs: require('./lib/jobs')(config),
        cluster: require('./lib/cluster')(config)
    }
};