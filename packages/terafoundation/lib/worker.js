'use strict';

module.exports = function workerModule(context) {
    const { logger } = context;
    logger.info('Stub Worker.');
};
