'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var getClient = require('../../utils/config').getClient;
var elasticError = require('../../utils/error_utils').elasticError;


module.exports = function(context) {
    if (_.includes(context.sysconfig.terafoundation.logging, 'elasticsearch')) {
        var client = getClient(context, context.sysconfig.teraslice.state, 'elasticsearch');
        var template = require('./backends/mappings/logs.json');

        return client.indices.putTemplate({body: template, name: 'logs_template'})
            .then(function(results) {
                return results
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                return Promise.reject(errMsg)
            })
    }
    else {
        return Promise.resolve(true)
    }
};
