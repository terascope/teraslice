import debugFn from 'debug';
import { EventEmitter } from 'node:events';
import type { Logger } from '@terascope/types';
import { isPlainObject } from './deps.js';
import { toString, isString, trimAndToLower } from './strings.js';
import { uniq } from './arrays.js';
import { isTest } from './env.js';
import { isKey } from './objects.js';

interface DebugParamObj {
    module: string;
    assignment?: string;
    [name: string]: any;
}

type DebugParam = DebugParamObj | string;
export const logLevels = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};

let logLevel = (process.env.DEBUG_LOG_LEVEL && isKey(logLevels, process.env.DEBUG_LOG_LEVEL))
    ? process.env.DEBUG_LOG_LEVEL
    : 'debug';

export function debugLogger(testName: string, param?: DebugParam, otherName?: string): Logger {
    const logger: Logger = new EventEmitter() as Logger;
    let parts: string[] = testName ? testName.split(':') : [];

    if (param) {
        if (isString(param)) {
            parts.push(param as string);
        } else if (typeof param === 'object') {
            parts.push(param.module);
            if (param.assignment) {
                parts.push(param.assignment);
            }
        }
    }

    if (otherName) {
        parts.push(otherName);
    }
    parts = parts.map(toString).map(trimAndToLower);
    parts = uniq(parts.filter((str) => !!str));

    if (!parts.includes('teraslice')) {
        parts.unshift('teraslice');
    }

    const name = parts.join(':');

    logger.streams = [];

    logger.addStream = () => {};

    logger.child = (opts: Record<string, any>, _simple?: boolean): Logger => {
        if (isString(opts)) {
            return debugLogger(name, undefined, opts);
        }
        if (isPlainObject(opts)) {
            return debugLogger(name, opts as DebugParam, opts.module);
        }
        return debugLogger(name, opts as DebugParam);
    };

    logger.flush = async () => true;
    logger.reopenFileStreams = () => {};
    logger.src = false;

    // @ts-expect-error
    logger.level = (value: Logger.LogLevel): number | undefined => {
        if (value) {
            for (const [level, code] of Object.entries(logLevels)) {
                if ((value === level || value === code) && isKey(logLevels, level)) {
                    logLevel = level;
                    return undefined;
                }
            }
            return undefined;
        }

        return logLevels[logLevel] || 20;
    };
    // @ts-expect-error
    logger.levels = () => logger.level();

    for (const [level, code] of Object.entries(logLevels)) {
        const fLevel = `[${level.toUpperCase()}]`;
        const debug = debugFn(name);

        logger[level as keyof Logger] = (...args: any[]) => {
            if (code < logger.level()) return false;
            if (level === 'fatal' && !isTest) {
                console.error(`${name} ${fLevel}`, ...args);
                return true;
            }

            debug(fLevel, ...args);
            return true;
        };
    }

    return logger;
}

export { Logger };
