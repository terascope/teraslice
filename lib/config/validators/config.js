'use strict';

const _ = require('lodash');
const convict = require('convict');
const convictFormats = require('../../utils/convict_utils');
const commonSchema = require('../schemas/job').commonSchema();

// Add custom teraslice formats
convictFormats.forEach((format) => {
    convict.addFormat(format);
});

/**
 * Merges the provided inputSchema with commonSchema and then validates the
 * provided jobConfig or opConfig against the resultant schema.
 * @param  {Object} inputSchema a convict compatible schema
 * @param  {Object} inputConfig a jobConfig or opConfig object
 * @return {Object}             a validated jobConfig or opConfig
 */
function validateConfig(inputSchema, inputConfig) {
    const schema = inputConfig._op ? _.merge(inputSchema, commonSchema) : inputSchema;
    const config = convict(schema);

    try {
        config.load(inputConfig);
        config.validate({ strict: false });
    } catch (err) {
        if (config._op) {
            throw new Error(`Validation failed for opConfig: ${inputConfig._op} - ${err.message}`);
        }
        throw new Error(err.stack);
    }

    return config.getProperties();
}

module.exports = function () {
    return {
        validateConfig
    };
};
