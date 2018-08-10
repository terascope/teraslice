#!/usr/bin/env node

'use strict';

/* eslint-disable class-methods-use-this, no-console */

const _ = require('lodash');
const path = require('path');
const yargs = require('yargs');
const get = require('lodash/get');

const { Worker, ExecutionController } = require('.');
const makeExecutionContext = require('./lib/execution-context');
const { readSysConfig } = require('./lib/terafoundation');
const { generateContext } = require('./lib/utils/context');
const processHandler = require('./process-handler');

class Command {
    constructor() {
        const {
            configfile,
            executionContext: ex,
            nodeType,
            useDebugLogger
        } = this._parseArgs();

        const sysconfig = readSysConfig({ configfile });

        this.context = generateContext(sysconfig, useDebugLogger);

        this.executionContext = {
            assignment: nodeType,
            job: _.omit(ex, [
                'node_id',
                'ex_id',
                'job_id',
                'slicer_port',
                'slicer_hostname',
            ]),
            ex_id: ex.ex_id,
            job_id: ex.job_id,
            slicer_port: ex.slicer_port,
            slicer_hostname: ex.slicer_hostname,
        };

        this.logger = this.context.logger;
        this.shutdownTimeout = get(this.context, 'sysconfig.teraslice.shutdown_timeout', 60 * 1000);
    }

    async initialize() {
        this.executionContext = await makeExecutionContext(this.context, this.executionContext);

        if (this.executionContext.assignment === 'worker') {
            this.instance = new Worker(this.context, this.executionContext);
        } else if (this.executionContext.assignment === 'execution_controller') {
            this.instance = new ExecutionController(this.context, this.executionContext);
        }

        await this.instance.initialize();
    }

    async run() {
        try {
            await this.instance.run();
        } catch (err) {
            await this.shutdown(err);
            process.exit(1);
        }

        await this.shutdown();
        process.exit(0);
    }

    async shutdown(err) {
        if (err) {
            this.logError(err);
        }

        try {
            await this.instance.shutdown();
        } catch (shutdowErr) {
            this.logError(shutdowErr);
        }

        try {
            await this.logger.flush();
            // hack for logger to flush
            await Promise.delay(600);
        } catch (flushErr) {
            this.logError(flushErr);
        }
    }

    logError(err) {
        if (err.message) {
            this.log('error', err.message);
        } else {
            this.log('error', err);
        }

        if (err.stack) {
            this.log('error', err.stack);
        }
    }

    log(level = 'info', ...args) {
        if (_.isFunction(this.logger[level])) {
            this.logger[level](...args);
        } else if (console[level]) {
            console[level](...args);
        } else {
            console.error(...args);
        }
    }

    registerExitHandler() {
        processHandler(
            async (signal, err) => {
                if (err) {
                    await this.shutdown(`${signal} was caught, exiting... ${err.stack}`);
                    return;
                }

                if (signal === 'SIGTERM' || signal === 'SIGINT') {
                    await this.shutdown(`Exit called due to signal ${signal}, shutting down...`);
                }
            },
            this.shutdownTimeout
        );
    }

    _parseArgs() {
        const { argv } = yargs.usage('Usage: $0 [options]')
            .scriptName('teraslice-worker')
            .version()
            .alias('v', 'version')
            .help()
            .alias('h', 'help')
            .option('e', {
                alias: 'executionContext',
                coerce: (arg) => {
                    if (!arg) {
                        throw new Error('Execution context must not be not be empty');
                    }

                    const ex = Buffer.from(arg, 'base64').toString('utf-8');

                    try {
                        return JSON.parse(ex);
                    } catch (err) {
                        throw new Error('Execution context be a valid JSON');
                    }
                },
                default: process.env.EX,
                demandOption: true,
                describe: `Execution Context, in the format of a base64 encoded json string.
                Defaults to env EX.`,
            })
            .option('n', {
                alias: 'nodeType',
                default: process.env.NODE_TYPE,
                demandOption: true,
                choices: ['execution_controller', 'worker'],
                describe: `Node Type assignment of worker.
                Defaults to env NODE_TYPE`,
            })
            .option('c', {
                alias: 'configfile',
                describe: `Terafoundation configuration file to load.
                Defaults to env TERAFOUNDATION_CONFIG.`,
                coerce: (arg) => {
                    if (!arg) return '';
                    return path.resolve(arg);
                },
            })
            .option('d', {
                alias: 'useDebugLogger',
                describe: `Override logger with debug logger, for development use only.
                Defaults to env USE_DEBUG_LOGGER.`,
                default: process.env.USE_DEBUG_LOGGER === 'true',
                boolean: true
            })
            .wrap(yargs.terminalWidth());

        return argv;
    }
}

async function runCommand() {
    const cmd = new Command();
    await cmd.registerExitHandler();
    await cmd.initialize();
    await cmd.run();
}

runCommand();
