'use strict';

module.exports = function(config) {
    var request = require('./request')(config);

    function state() {
        return request.get("/cluster/state");
    }

    function slicers() {
        return request.get("/cluster/slicers");
    }

    return {
        state: state,
        slicers: slicers,
        nodes: () => {
        }
    }
};