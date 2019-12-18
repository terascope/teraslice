'use strict';

const { logError } = require('@terascope/utils');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const makeStateStore = require('../storage/state');

module.exports = async function stateService(context) {
    const logger = makeLogger(context, 'execution_service');

    const stateStore = await makeStateStore(context);
    async function search(query, from, size, sort) {
        return stateStore.search(query, from, size, sort);
    }

    async function initialize() {
        logger.info('state service is initializing...');
    }

    async function shutdown() {
        await stateStore.shutdown().catch((err) => {
            logError(logger, err, 'Error while shutting down job stores');
        });
    }

    return {
        search,
        initialize,
        shutdown
    };
};
