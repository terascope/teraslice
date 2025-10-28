import fs from 'node:fs';
import path from 'node:path';
import bunyan from 'bunyan';
import {
    toBoolean, debugLogger, isTest,
    Logger, includes
} from '@terascope/core-utils';
import { Terafoundation } from '@terascope/types';

type LogLevelObj = {
    [type in Terafoundation.LogType]: Terafoundation.LogLevelType;
};

function getLogLevel(level: Terafoundation.LogLevelConfig): LogLevelObj {
    // Set the same level for all logging types.
    if (typeof level === 'string') {
        return {
            console: level as Terafoundation.LogLevelType,
            file: level as Terafoundation.LogLevelType
        };
    }

    // Otherwise there may be a list of separate settings for each type.
    return level.reduce((prev, curr) => {
        Object.assign(prev, curr);
        return prev;
    }, {} as LogLevelObj);
}

export function createRootLogger(
    context: Terafoundation.Context<Record<string, any>>
): Logger {
    const useDebugLogger = (toBoolean(process.env.USE_DEBUG_LOGGER || isTest))
        && !toBoolean(process.env.TESTING_LOG_LEVEL);
    const filename = context.name;
    const name = context.assignment || filename;
    const foundationConfig = context.sysconfig.terafoundation;
    const logLevel = getLogLevel(foundationConfig.log_level);

    if (useDebugLogger) {
        return debugLogger(`${filename}:${name}`);
    }

    const streamConfig: bunyan.Stream[] = [];

    // Setup logging to console. 'logging: ["console"]' is the default
    if (includes(foundationConfig.logging, 'console')) {
        const level = logLevel.console ? logLevel.console : 'info';
        streamConfig.push({ stream: process.stdout, level });
    }

    // Setup logging to files.
    if (includes(foundationConfig.logging, 'file')) {
        const configPath = foundationConfig.log_path || './logs';

        // remove whitespace
        const logFile = filename.trim();

        try {
        // Verify the path is a directory by resolving any symlinks
            const pathCheck = fs.lstatSync(fs.realpathSync(configPath));
            if (pathCheck.isDirectory()) {
                const level = logLevel.file ? logLevel.file : 'info';
                streamConfig.push({ path: path.join(configPath, `${logFile}.log`), level });
            } else {
            // This is error is just caught by the catch block below.
                throw new Error(`${configPath} is not a directory`);
            }
        } catch (e) {
            throw new Error(`Could not write to log_path: ${configPath}`);
        }
    }

    const loggerConfig: bunyan.LoggerOptions = {
        name: filename,
        streams: streamConfig,
        assignment: context.assignment,
    };

    const logger = bunyan.createLogger(loggerConfig) as Logger;
    logger.flush = async () => true;
    return logger;
}
