'use strict';

/* eslint-disable no-console */

const Promise = require('bluebird');

module.exports = (fn, timeout = 20 * 1000) => {
    const exit = (signal, err) => {
        if (err) {
            console.error(`caught ${signal} with error: ${err.stack}, exiting...`);
        } else {
            console.error(`caught ${signal}, exiting...`);
        }

        const startTime = Date.now();
        Promise.race([
            fn(signal, err),
            Promise.delay(timeout)
        ]).then(() => {
            console.log(`Exiting... took ${Date.now() - startTime}ms`);
            process.exit(process.exitCode || 0);
        }).catch((error) => {
            console.error(error.stack ? error.stack : error.toString());
            process.exit(process.exitCode || 1);
        });
    };

    process.on('SIGINT', () => {
        exit('SIGINT');
    });

    process.on('SIGTERM', () => {
        exit('SIGTERM');
    });

    process.on('uncaughtException', (err) => {
        exit('uncaughtException', err);
    });

    process.on('unhandledRejection', (err) => {
        exit('unhandledRejection', err);
    });
};
