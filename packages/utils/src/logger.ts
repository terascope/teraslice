import debugFn from 'debug';
import { EventEmitter } from 'events';
import { isPlainObject } from './core';
import { toString, isString, trimAndToLower } from './strings';
import { Logger } from './logger-interface';
import { uniq } from './arrays';
import { isTest } from './env';

interface DebugParamObj {
    module: string;
    assignment?: string;
    [name: string]: any;
}

type debugParam = DebugParamObj | string;
let logLevel = process.env.DEBUG_LOG_LEVEL || 'debug';
const levels = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};

export function debugLogger(testName: string, param?: debugParam, otherName?: string): Logger {
    const logger: Logger = new EventEmitter() as Logger;

    let parts: string[] = [testName];
    if (testName.indexOf('teraslice') < 0) {
        parts.unshift('teraslice');
    }

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

    const name = parts.join(':');

    logger.streams = [];

    logger.addStream = (stream) => {
        // @ts-ignore
        this.streams.push(stream);
    };

    // @ts-ignore
    logger.child = (opts: debugParam) => {
        if (isString(opts)) {
            return debugLogger(name, undefined, opts);
        }
        if (isPlainObject(opts)) {
            return debugLogger(name, opts, opts.module);
        }
        return debugLogger(name, opts);
    };

    logger.flush = async () => true;
    logger.reopenFileStreams = () => {};
    logger.src = false;

    // @ts-ignore
    logger.level = (value: Logger.LogLevel): number|undefined => {
        if (value) {
            for (const [level, code] of Object.entries(levels)) {
                if (value === level || value === code) {
                    logLevel = level;
                    return undefined;
                }
            }
            return undefined;
        }
        // eslint-disable-next-line
        return levels[logLevel] || 20;
    };
    // @ts-ignore
    logger.levels = () => logger.level();

    for (const [level, code] of Object.entries(levels)) {
        const fLevel = `[${level.toUpperCase()}]`;
        const debug = debugFn(name);

        logger[level] = (...args: any[]) => {
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
