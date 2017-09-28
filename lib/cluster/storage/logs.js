'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const getClient = require('../../utils/config').getClient;

module.exports = function module(context) {
    if (_.includes(context.sysconfig.terafoundation.logging, 'elasticsearch')) {
        const client = getClient(context, context.sysconfig.teraslice.state, 'elasticsearch');
        const template = require('./backends/mappings/logs.json');
        const name = 'logs_template';
        const elasticsearch = require('elasticsearch_api')(client, context.logger, null);

        return elasticsearch.putTemplate(template, name);
    }

    return Promise.resolve(true);
};
