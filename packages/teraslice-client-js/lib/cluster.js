'use strict';

module.exports = function(config) {
    var request = require('./request')(config);

    function state() {
        return request.get("/cluster/state");
    }

    function stats() {
        return request.get("/cluster/stats");
    }

    function slicers() {
        return request.get("/cluster/slicers");
    }

    return {
        state: state,
        stats: stats,
        slicers: slicers,
        nodes: () => {
        }
    }
};
