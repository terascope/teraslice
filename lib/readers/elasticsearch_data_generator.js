'use strict';

const Promise = require('bluebird');
const { getOpConfig } = require('../utils/config');
const mocker = require('mocker-data-generator').default;
const defaultSchema = require('../utils/data_utils');
const { existsSync } = require('../utils/file_utils');
const parseError = require('@terascope/error-parser');

function parsedSchema(opConfig) {
    let dataSchema = false;

    if (opConfig.json_schema) {
        const firstPath = opConfig.json_schema;
        const nextPath = `${process.cwd()}/${opConfig.json_schema}`;

        try {
            if (existsSync(firstPath)) {
                dataSchema = require(firstPath);
            } else {
                dataSchema = require(nextPath);
            }
            return dataSchema;
        } catch (e) {
            throw new Error(`Could not retrieve code for: ${opConfig}\n${e}`);
        }
    } else {
        return defaultSchema(opConfig, dataSchema);
    }
}

function newReader(context, opConfig) {
    const dataSchema = parsedSchema(opConfig);
    return (msg) => {
        if (opConfig.stress_test) {
            return mocker()
                .schema('schema', dataSchema, 1)
                .build()
                .then((dataObj) => {
                    const results = [];
                    const data = dataObj.schema[0];
                    for (let i = 0; i < msg; i += 1) {
                        results.push(data);
                    }
                    return results;
                })
                .catch(err => Promise.reject(`could not generate data error: ${parseError(err)}`));
        }

        return mocker()
            .schema('schema', dataSchema, msg)
            .build()
            .then(dataObj => dataObj.schema)
            .catch(err => Promise.reject(`could not generate data error: ${parseError(err)}`));
    };
}

function onceGenerator(context, opConfig, executionConfig) {
    let numOfRecords = opConfig.size;
    const lastOp = executionConfig.operations[executionConfig.operations.length - 1];
    const interval = lastOp.size ? lastOp.size : 5000;

    return () => {
        if (numOfRecords <= 0) {
            return null;
        }

        if (numOfRecords - interval >= 0) {
            numOfRecords -= interval;
            return interval;
        }

        const finalCount = numOfRecords;
        numOfRecords = 0;
        return finalCount;
    };
}

function persistentGenerator(context, opConfig) {
    return () => opConfig.size;
}

function newSlicer(context, executionContext) {
    const executionConfig = executionContext.config;
    const opConfig = getOpConfig(executionConfig, 'elasticsearch_data_generator');
    const slicers = [];

    if (executionConfig.lifecycle === 'once') {
        slicers.push(onceGenerator(context, opConfig, executionConfig));
    } else {
        slicers.push(persistentGenerator(context, opConfig, executionConfig));
    }

    return Promise.resolve(slicers);
}

function schema() {
    return {
        json_schema: {
            doc: 'file path to custom data schema',
            default: '',
            format: 'optional_String'
        },
        size: {
            doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved ' +
            'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
            default: 5000,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for elasticsearch_data_generator must be a number');
                } else if (val <= 0) {
                    throw new Error('size parameter for elasticsearch_data_generator must be greater than zero');
                }
            }
        },
        start: {
            doc: 'The start date (ISOstring or in ms) to which it will read from ',
            default: '',
            format: 'optional_Date'
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: '',
            format: 'optional_Date'
        },
        format: {
            doc: 'This is only used with the teraslice provided schema, can elect different time structures' +
            'such as dateNow, utcDate, utcBetween and isoBetween',
            default: '',
            format: 'optional_String'
        },
        stress_test: {
            doc: 'used to speed up the creation process to test elasticsearch load',
            default: false,
            format: Boolean
        },
        date_key: {
            doc: 'key value on schema where date should reside',
            default: 'created',
            format: String
        },
        set_id: {
            doc: 'used to make an id on the data that will be used for the doc _id for elasticsearch, values: base64url, hexadecimal, HEXADECIMAL',
            default: '',
            format: 'optional_String'
        },
        id_start_key: {
            doc: 'set if you would like to force the first part of the ID to a certain character',
            default: '',
            format: 'optional_String'
        }
    };
}

function selfValidation(op) {
    if (op.id_start_key && !op.set_id) {
        throw new Error('elasticsearch_data_generator is mis-configured, id_start_key must be used with set_id parameter, please set the missing parameters');
    }
}

function crossValidation(context, job) {
    const opConfig = getOpConfig(job, 'elasticsearch_data_generator');

    if (opConfig.set_id) {
        const indexSelectorConfig = job.operations.find(op => op._op === 'elasticsearch_index_selector');

        if (!indexSelectorConfig.id_field) {
            throw new Error('elasticsearch_data_generator is mis-configured, set_id must be used in tandem with id_field which is set in elasticsearch_index_selector');
        }

        if (indexSelectorConfig.id_field !== 'id') {
            throw new Error('id_field set in elasticsearch_index_selector must be set to "id" when elasticsearch_data_generator is creating ids');
        }
    }
}

function slicerQueueLength() {
    // Queue is not really needed so we just want the smallest queue size available.
    return 'QUEUE_MINIMUM_SIZE';
}

module.exports = {
    newReader,
    newSlicer,
    selfValidation,
    crossValidation,
    schema,
    slicerQueueLength
};

