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

        convictFormats.forEach(function(obj) {
            convict.addFormat(obj)
        });

        //top level job validation occurs, but not operations
        validJob = validateOperation(jobSchema, validJob, false);

        validJob.operations = [];

        job.operations.forEach(function(opConfig, i) {
            //Reader
            if (i === 0) {
                //reader = getPath('readers', opConfig._op, opPath);
                var reader = op_runner.load('readers', opConfig._op);
                hasSchema(reader, opConfig._op);

                validJob.operations.push(validateOperation(reader.schema(), opConfig, true));
            }
            //Sender
            else if (i === job.operations.length - 1) {
                //sender = getPath('senders', opConfig._op, opPath);
                var sender = op_runner.load('senders', opConfig._op);
                hasSchema(sender, opConfig._op);

                validJob.operations.push(validateOperation(sender.schema(), opConfig, true));
            }
            //Processor
            else {
                //var processor = getPath('processors', opConfig._op, opPath);
                var processor = op_runner.load('processors', opConfig._op);
                hasSchema(processor, opConfig._op);

                validJob.operations.push(validateOperation(processor.schema(), opConfig, true));
            }
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

    function validateOperation(opSchema, job, isOp) {
        var schema = isOp ? _.merge(opSchema, commonSchema) : opSchema;
        var config = convict(schema);
        config.load(job);

        if (context.cluster.isMaster) {
            config.validate(/*{strict: true}*/);
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

    return {
        validate: validate,
        __test_context: __test_context
    }
}