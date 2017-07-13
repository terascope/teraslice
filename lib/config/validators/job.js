'use strict';

var _ = require('lodash');
var convict = require('convict');
var convictFormats = require('../../utils/convict_utils');
var configValidator = require('./config')();


module.exports = function(context) {
    var logger = context.logger;
    var op_runner = require('../../cluster/runners/op')(context);

    var jobSchema = require('../schemas/job').jobSchema(context);
    var commonSchema = require('../schemas/job').commonSchema();

    // This function will validate the job and return a clone with all
    // default parameters expanded.
    function validate(job) {

        var assetPath = job.assets ? context.sysconfig.teraslice.assets_directory : null;
        var jobAssets = job.assets;
        var validJob = _.cloneDeep(job);

        convictFormats.forEach(function(format) {
            convict.addFormat(format)
        });

        //this is used if an operation needs to provide additional validation beyond its own scope
        var topLevelJobValidators = [];
        //top level job validation occurs, but not operations
        validJob = configValidator.validateConfig(jobSchema, validJob);

        validJob.operations = job.operations.map(function(opConfig) {
            var operation = op_runner.load(opConfig._op, assetPath, jobAssets);
            hasSchema(operation, opConfig._op);
            var validOP = configValidator.validateConfig(operation.schema(), opConfig);

            if (operation.op_validation) {
                operation.op_validation(validOP)
            }

            if (operation.post_validation) {
                topLevelJobValidators.push(operation.post_validation)
            }

            return validOP;
        });

        topLevelJobValidators.forEach(function(fn) {
            fn(validJob, context.sysconfig);
        });

        return validJob;
    }

    function hasSchema(obj, name) {
        if (!obj.schema || typeof obj.schema !== 'function') {
            throw new Error(`${name} needs to have a method named "schema"`)
        }
        else {
            if (typeof obj.schema() !== 'object') {
                throw new Error(`${name} schema needs to return an object`)
            }
        }
    }

    // Expose internal functions for unit testing.
    function __test_context(temp_context) {
        if (temp_context) context = temp_context;

        return {
            hasSchema: hasSchema,
            validateOperation: validateOperation
        }
    }

    var api = {
        validate: validate,
        __test_context: __test_context
    };

    return api;
};
