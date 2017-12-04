'use strict';

var request = require('request-promise');

module.exports = function(config) {
    var teraslice_host = config.host;

    if (!teraslice_host) {
        teraslice_host = 'http://localhost:5678'
    }

    function get(path) {
        return request({
            method: 'GET',
            uri: teraslice_host + path,
            json: true // Automatically stringifies the body to JSON
        });
    }

    function post(path, record, isStream) {
        var config = {
            method: 'POST',
            uri: teraslice_host + path,
            body: record
        };

        if (!isStream) config.json = true;
        return request(config);
    }


    function put(path, record) {
        return request({
            method: 'PUT',
            uri: teraslice_host + path,
            body: record,
            json: true // Automatically stringifies the body to JSON
        });
    }

    function deleteFn(path) {
        return request({
            method: 'DELETE',
            uri: teraslice_host + path
        });
    }

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteFn
    }
};