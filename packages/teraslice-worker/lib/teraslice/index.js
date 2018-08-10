'use strict';

const get = require('lodash/get');
const moment = require('moment');
const configSchema = require('teraslice/lib/config/schemas/system').config_schema;
const schemaFormats = require('teraslice/lib/utils/convict_utils');
const makeExStore = require('teraslice/lib/cluster/storage/execution');
const makeAssetStore = require('teraslice/lib/cluster/storage/assets');
const makeStateStore = require('teraslice/lib/cluster/storage/state');
const makeAnalyticsStore = require('teraslice/lib/cluster/storage/analytics');
const makeJobStore = require('teraslice/lib/cluster/storage/jobs');
const makeOpRunner = require('teraslice/lib/cluster/runners/op');
const makeJobValidator = require('teraslice/lib/config/validators/job');
const makeSliceAnalytics = require('teraslice/lib/cluster/execution_controller/slice_analytics');
const makeExecutionRecovery = require('teraslice/lib/cluster/execution_controller/recovery');
const { dateFormat } = require('teraslice/lib/utils/date_utils');
const { saveAsset } = require('teraslice/lib/utils/file_utils');

function opsDirectory(configFile) {
    return get(configFile, 'teraslice.ops_directory', null);
}

function clusterName(configFile) {
    return get(configFile, 'teraslice.name', null);
}

function loggingConnection(configFile) {
    return get(configFile, 'teraslice.state.connection', 'default');
}

function getTerasliceConfig(sysconfig) {
    return Object.assign({
        name: 'teraslice',
        config_schema: configSchema,
        schema_formats: schemaFormats,
        ops_directory: opsDirectory,
        cluster_name: clusterName,
        logging_connection: loggingConnection
    }, sysconfig);
}

async function validateJob(context, jobSpec) {
    const jobValidator = makeJobValidator(context);
    try {
        return jobValidator.validate(jobSpec);
    } catch (error) {
        throw new Error(`validating job: ${error}`);
    }
}

async function initializeJob(context, config, stores = {}) {
    const jobStore = stores.jobStore || await makeJobStore(context);
    const exStore = stores.exStore || await makeExStore(context);

    const validJob = await validateJob(context, config, { skipRegister: true });
    const jobSpec = await jobStore.create(config);

    const job = Object.assign({}, jobSpec, validJob);

    const ex = await exStore.create(job, 'ex');
    await exStore.setStatus(ex.ex_id, 'pending');

    if (!Object.keys(stores).length) {
        await Promise.all([
            exStore.shutdown(true),
            jobStore.shutdown(true),
        ]);
    }

    return {
        job,
        ex,
    };
}

function newFormatedDate() {
    return moment().format(dateFormat);
}

module.exports = {
    dateFormat,
    getTerasliceConfig,
    initializeJob,
    makeExStore,
    makeStateStore,
    makeAnalyticsStore,
    makeAssetStore,
    makeJobStore,
    makeSliceAnalytics,
    makeExecutionRecovery,
    makeOpRunner,
    saveAsset,
    validateJob,
    newFormatedDate,
};
