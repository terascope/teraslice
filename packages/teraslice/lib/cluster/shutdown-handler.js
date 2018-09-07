'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

module.exports = (context, logger, fn) => {
    const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout', 20 * 1000);
    const events = context.apis.foundation.getSystemEvents();

    const exit = (signal, err) => {
        logger.info(`will exiting in ${shutdownTimeout}ms...`);

        const startTime = Date.now();
        Promise.race([
            fn(signal, err),
            Promise.delay(shutdownTimeout)
        ]).then(() => {
            logger.debug(`Exiting... took ${Date.now() - startTime}ms`);
            process.exit(process.exitCode || 0);
        }).catch((error) => {
            logger.error(error.stack ? error.stack : error.toString());
            process.exit(process.exitCode || 1);
        });
    };

    process.on('SIGINT', () => {
        logger.warn('Received process:SIGINT');
        exit('SIGINT');
    });

    process.on('SIGTERM', () => {
        logger.warn('Received process:SIGTERM');
        exit('SIGTERM');
    });

    process.on('uncaughtException', (err) => {
        logger.fatal('Received an uncaughtException', err);
        exit('uncaughtException', err);
    });

    process.on('unhandledRejection', (err) => {
        logger.fatal('Received an unhandledRejection', err);
        exit('unhandledRejection', err);
    });

    // event is fired from terafoundation when an error occurs during instantiation of a client
    events.on('client:initialization:error', (err) => {
        logger.fatal('Received a client initialization error', err);
        exit('client:initialization:error', err);
    });
};
