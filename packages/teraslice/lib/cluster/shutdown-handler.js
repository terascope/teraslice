'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

module.exports = (context, logger, fn) => {
    const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout', 20 * 1000);
    const events = context.apis.foundation.getSystemEvents();

    const exit = (signal, err) => {
        logger.info(`exiting in ${shutdownTimeout}ms...`);

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
        logger.error('Recieved process:SIGINT');
        exit('SIGINT');
    });

    process.on('SIGTERM', () => {
        logger.error('Recieved process:SIGTERM');
        exit('SIGTERM');
    });

    process.on('uncaughtException', (err) => {
        logger.fatal('Got an uncaughtException', err);
        exit('uncaughtException', err);
    });

    process.on('unhandledRejection', (err) => {
        logger.fatal('Got an unhandledRejection', err);
        exit('unhandledRejection', err);
    });

    // event is fired from terafoundation when an error occurs during instantiation of a client
    events.on('client:initialization:error', (err) => {
        logger.fatal('Got a client initialization error', err);
        exit('client:initialization:error', err);
    });
};
