'use strict';

module.exports = function(config) {
    var request = require('./request')(config);

    function state() {
        return request.get("/cluster/_state");
    }

    function slicers() {
        return request.get("/cluster/_slicers");
    }

    return {
        state: state,
        slicers: slicers,
        nodes: () => {}
    }
}