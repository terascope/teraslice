'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const { getClient } = require('../../utils/config');

module.exports = function module(context) {
    if (_.includes(context.sysconfig.terafoundation.logging, 'elasticsearch')) {
        const client = getClient(context, context.sysconfig.teraslice.state, 'elasticsearch');
        const template = require('./backends/mappings/logs.json');
        const elasticsearch = require('@terascope/elasticsearch-api')(client, context.logger, null);
        const clusterName = context.sysconfig.teraslice.name;
        const name = `${clusterName}_logs_template`;
        // setting template name to reflect current teraslice instance name to help prevent
        // conflicts with differing versions of teraslice with same elastic db
        template.template = `${clusterName}${template.template}`;

        return elasticsearch.putTemplate(template, name);
    }

    return Promise.resolve(true);
};
