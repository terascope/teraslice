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

    function txt(type) {
        return request.get(`/txt/${type}`);
    }

    function getEndpoint(endpoint) {
        return request.get(endpoint)
    }

    function post(endpoint, data){
        return request.post(endpoint, data)
    }

    function put(endpoint, data){
        return request.put(endpoint, data)
    }

    function deleteFn(endpoint){
        return request.delete(endpoint)
    }

    return {
        state: state,
        stats: stats,
        slicers: slicers,
        nodes: () => {},
        txt: txt,
        get: getEndpoint,
        post: post,
        put: put,
        delete: deleteFn

    }
};
