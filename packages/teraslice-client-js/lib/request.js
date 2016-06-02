'use strict';

var Promise = require('bluebird');
var request = require('request-promise');

module.exports = function(config) {
    var teraslice_host = config.host;

    function get(path) {
        return request({
            method: 'GET',
            uri: teraslice_host + path,
            json: true // Automatically stringifies the body to JSON
        });
    }

    function post(path, record) {
        return request({
            method: 'POST',
            uri: teraslice_host + path,
            body: record,
            json: true // Automatically stringifies the body to JSON
        });
    }

    return {
        get: get,
        post: post
    }
}