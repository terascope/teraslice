'use strict';

const fs = require('fs');
const path = require('path');
const bunyan = require('bunyan');
const { includes } = require('@terascope/utils');

function getLogLevel(level) {
    // Set the same level for all logging types.
    if (typeof level === 'string') {
        return { console: level, file: level, elasticsearch: level };
    }

    // Otherwise there may be a list of separate settins for each type.
    return level.reduce((prev, curr) => {
        Object.assign(prev, curr);
        return prev;
    }, {});
}

module.exports = function makeLoggerModule(context) {
    const loggingConfig = context.sysconfig.terafoundation;
    const logLevel = getLogLevel(loggingConfig.log_level);

    // This is the root logger. Module specific loggers will be created
    // as children of this logger
    let logger;

    function _createChildLogger(name, _meta) {
        const meta = _meta || {};

        // subsequent child loggers don't need name or filename,
        // check to see if name parameter is actual _meta
        const metaData = typeof name === 'object' ? name : meta;
        const newLogger = logger.child(metaData);
        // add flush fn to the new logger
        newLogger.flush = logger.flush;

        return newLogger;
    }

    return function makeLogger(loggerName, filename, _meta) {
        // If there is already a logger defined we're just creating a
        // child logger using the same config.
        if (logger) {
            return _createChildLogger(loggerName, _meta);
        }

        const streamConfig = [];
        const { environment } = loggingConfig;

        // Setup console logging. Always turned on for development but off by
        // default for production.
        if (!environment || environment === 'development' || includes(loggingConfig.logging, 'console')) {
            const level = logLevel.console ? logLevel.console : 'info';
            streamConfig.push({ stream: process.stdout, level });
        }

        // Setup logging to files.
        // FIXME: this currently sends logs to files anytime environment is
        // production. There are scenarios where this may not be desireable.
        if (environment === 'production' || includes(loggingConfig.logging, 'file')) {
            const configPath = loggingConfig.log_path || './logs';

            // remove whitespace
            const logfile = filename.trim();

            try {
                // Verify the path is a directory by resolving any symlinks
                const pathCheck = fs.lstatSync(fs.realpathSync(configPath));
                if (pathCheck.isDirectory()) {
                    const level = logLevel.file ? logLevel.file : 'info';
                    streamConfig.push({ path: path.join(configPath, `${logfile}.log`), level });
                } else {
                    // This is error is just caught by the catch block below.
                    throw new Error(`${configPath} is not a directory`);
                }
            } catch (e) {
                throw new Error(`Could not write to log_path: ${configPath}`);
            }
        }

        const loggerConfig = {
            name: loggerName,
            level: logLevel.elasticsearch,
            streams: streamConfig
        };

        logger = bunyan.createLogger(loggerConfig);
        logger.flush = async () => true;

        return logger;
    };
};
