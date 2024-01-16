import fs from 'fs';
import path from 'path';
import bunyan from 'bunyan';
import * as ts from '@terascope/utils';
import * as i from '../interfaces';

type LogLevelObj = {
    [type in i.LogType]: i.LogLevelType;
};

function getLogLevel(level: i.LogLevelConfig): LogLevelObj {
    // Set the same level for all logging types.
    if (typeof level === 'string') {
        return {
            console: level as i.LogLevelType,
            file: level as i.LogLevelType
        };
    }

    // Otherwise there may be a list of separate settins for each type.
    return level.reduce((prev, curr) => {
        Object.assign(prev, curr);
        return prev;
    }, {} as LogLevelObj);
}

export function createRootLogger(
    context: i.FoundationContext<Record<string, any>>
): ts.Logger {
    const useDebugLogger = (ts.toBoolean(process.env.USE_DEBUG_LOGGER || ts.isTest))
                        && !ts.toBoolean(process.env.TESTING_LOG_LEVEL);
    const filename = context.name;
    const name = context.assignment || filename;
    const foundationConfig = context.sysconfig.terafoundation;
    const logLevel = getLogLevel(foundationConfig.log_level);

    if (useDebugLogger) {
        return ts.debugLogger(`${filename}:${name}`);
    }

    const streamConfig: bunyan.Stream[] = [];
    const { environment = 'development' } = foundationConfig;

    // Setup console logging. Always turned on for development but off by
    // default for production.
    if (environment === 'development' || ts.includes(foundationConfig.logging, 'console')) {
        const level = logLevel.console ? logLevel.console : 'info';
        streamConfig.push({ stream: process.stdout, level });
    }

    // Setup logging to files.
    if (ts.includes(foundationConfig.logging, 'file')) {
        const configPath = foundationConfig.log_path || './logs';

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

    const loggerConfig: bunyan.LoggerOptions = {
        name: filename,
        streams: streamConfig,
        assignment: context.assignment,
    };

    const logger = bunyan.createLogger(loggerConfig) as ts.Logger;
    logger.flush = async () => true;
    return logger;
}
