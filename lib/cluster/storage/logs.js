'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var getClient = require('../../utils/config').getClient;

//TODO verify if logs need a full api

module.exports = function(context) {
    if (_.includes(context.sysconfig.terafoundation.logging, 'elasticsearch')) {
        var client = getClient(context, context.sysconfig.teraslice.state, 'elasticsearch');
        var template = require('./backends/mappings/logs.json');
        var name = 'logs_template';
        var elasticsearch = require('elasticsearch_api')(client, context.logger, null);

        return elasticsearch.putTemplate(template, name)
    }
    else {
        return Promise.resolve(true)
    }
};
