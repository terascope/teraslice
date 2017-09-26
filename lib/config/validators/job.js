'use strict';

const _ = require('lodash');
const convict = require('convict');
const convictFormats = require('../../utils/convict_utils');
const configValidator = require('./config')();


module.exports = function (_context) {
    let context = _context;
    const opRunner = require('../../cluster/runners/op')(context);

    const jobSchema = require('../schemas/job').jobSchema(context);
    const commonSchema = require('../schemas/job').commonSchema();
    const fullSchema = _.assign(commonSchema, jobSchema);

    // This function will validate the job and return a clone with all
    // default parameters expanded.
    function validate(job) {
        const assetPath = job.assets ? context.sysconfig.teraslice.assets_directory : null;
        const jobAssets = job.assets;
        let validJob = _.cloneDeep(job);

        convictFormats.forEach((format) => {
            convict.addFormat(format);
        });

        // this is used if an operation needs to provide additional validation beyond its own scope
        const topLevelJobValidators = [];
        // top level job validation occurs, but not operations
        validJob = configValidator.validateConfig(fullSchema, validJob);

        validJob.operations = job.operations.map((opConfig) => {
            const operation = opRunner.load(opConfig._op, assetPath, jobAssets);
            hasSchema(operation, opConfig._op);
            const validOP = configValidator.validateConfig(operation.schema(), opConfig);

            if (operation.selfValidation) {
                operation.selfValidation(validOP);
            }

            if (operation.crossValidation) {
                topLevelJobValidators.push(operation.crossValidation);
            }

            return validOP;
        });

        topLevelJobValidators.forEach((fn) => {
            fn(validJob, context.sysconfig);
        });

        return validJob;
    }

    function hasSchema(obj, name) {
        if (!obj.schema || typeof obj.schema !== 'function') {
            throw new Error(`${name} needs to have a method named "schema"`);
        } else if (typeof obj.schema() !== 'object') {
            throw new Error(`${name} schema needs to return an object`);
        }
    }

    // Expose internal functions for unit testing.
    function testContext(tempContext) {
        if (tempContext) context = tempContext;

        return {
            hasSchema,
            validate
        };
    }

    const api = {
        validate,
        __test_context: testContext
    };

    return api;
};
