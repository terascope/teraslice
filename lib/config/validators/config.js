var _ = require('lodash');
var convict = require('convict');
var convictFormats = require('../../utils/convict_utils');
var commonSchema = require('../schemas/job').commonSchema();

// Add custom teraslice formats
convictFormats.forEach(function(format) {
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
    var schema = inputConfig._op ? _.merge(inputSchema, commonSchema) : inputSchema;
    var config = convict(schema);

    try {
        config.load(inputConfig);
        config.validate(/* {strict: true} */);
    } catch (err) {
        if (config._op) {
            throw new Error(`Validation failed for opConfig: ${inputConfig._op} - ${err.message}`);
        }
        throw new Error(err.stack);
    }

    return config.getProperties();
}

module.exports = function() {
    return {
        validateConfig: validateConfig
    };
};
