'use strict';

var _ = require('lodash');
var convict = require('convict');

var jobSchema = require('../schemas/job').jobSchema;
var commonSchema = require('../schemas/job').commonSchema;
var convictFormats = require('../../utils/convict_utils');

module.exports = function(context) {
    var logger = context.logger;

    var op_runner = require('../../cluster/runners/op')(context);

    // This function will validate the job and return a clone with all
    // default parameters expanded.
    function validate(job) {
        var validJob = _.cloneDeep(job);

        convictFormats.forEach(function(format) {
            convict.addFormat(format)
        });

        //this is used if an operation needs to provide additional validation beyond its own scope
        var topLevelJobValidators = [];
        //top level job validation occurs, but not operations
        validJob = validateOperation(jobSchema, validJob, false);

        validJob.operations = job.operations.map(function(opConfig) {
            var operation = op_runner.load(opConfig._op);
            hasSchema(operation, opConfig._op);
            var validOP = validateOperation(operation.schema(), opConfig, true);

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
            throw new Error(name + ' needs to have a method named "schema"')
        }
        else {
            if (typeof obj.schema() !== 'object') {
                throw new Error(name + 'schema needs to return an object')
            }
        }
    }

    function validateOperation(inputSchema, operation, isOp) {
        var schema = isOp ? _.merge(inputSchema, commonSchema) : inputSchema;
        var config = convict(schema);

        try {
            try {
                config.load(operation);
            }
            catch (err) {
                console.log('its the loading things', err.stack)
            }

            config.validate(/*{strict: true}*/);
        }
        catch (err) {
            if (isOp) {
                throw new Error("Validation failed for operation: " + operation._op + " - " + err.message);
            }
            throw err;
        }

        return config.getProperties();
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