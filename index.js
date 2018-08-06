'use strict';

module.exports = {
    utils: {
        date: require('./lib/utils/date_utils'),
        file: require('./lib/utils/file_utils'),
        error: require('./lib/utils/error_utils'),
        schemaFormats: require('./lib/utils/convict_utils'),
        system: require('./lib/config/schemas/system')
    },
    validators: {
        job: require('./lib/config/validators/job'),
        config: require('./lib/config/validators/config')
    },
    runners: {
        execution: require('./lib/cluster/runners/execution'),
        op: require('./lib/cluster/runners/op'),
    },
    executionController: {
        sliceAnalytics: require('./lib/cluster/execution_controller/slice_analytics'),
        recovery: require('./lib/cluster/execution_controller/recovery'),
    },
    storage: {
        jobs: require('./lib/cluster/storage/jobs'),
        analytics: require('./lib/cluster/storage/analytics'),
        state: require('./lib/cluster/storage/state'),
        assets: require('./lib/cluster/storage/assets'),
        execution: require('./lib/cluster/storage/execution')
    },
};
