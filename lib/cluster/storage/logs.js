'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var getClient = require('../../utils/config').getClient;
var putTemplate = require('./backends/elasticsearch').putTemplate;

module.exports = function(context) {
    if (_.includes(context.sysconfig.terafoundation.logging, 'elasticsearch')) {
        var client = getClient(context, context.sysconfig.teraslice.state, 'elasticsearch');
        var template = require('./backends/mappings/logs.json');
        var name = 'logs_template';

        return putTemplate(client, template, name)
    }
    else {
        return Promise.resolve(true)
    }
};
