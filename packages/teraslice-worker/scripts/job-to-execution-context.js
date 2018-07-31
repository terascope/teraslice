#!/usr/bin/env node

'use strict';

/* eslint-disable class-methods-use-this, no-console */

const path = require('path');
const fs = require('fs-extra');
const yargs = require('yargs');
const porty = require('porty');
const _ = require('lodash');

const { readSysConfig } = require('../lib/terafoundation');
const { initializeJob } = require('../lib/teraslice');
const { generateContext } = require('../lib/utils/context');

class Command {
    constructor() {
        const {
            configfile,
            jobFile,
            slicerPort,
        } = this._parseArgs();

        const sysconfig = readSysConfig({ configfile });
        const context = generateContext(sysconfig, true);

        this.context = context;
        this.slicerPort = slicerPort;
        this.jobFile = jobFile;
    }

    async run() {
        await this.generatePort();

        const config = {
            slicer_port: this.slicerPort,
        };

        try {
            const { job, ex } = await initializeJob(this.context, this.jobFile);
            Object.assign(config, job, {
                ex_id: ex.ex_id,
                job_id: ex.job_id,
            });
        } catch (err) {
            this.logError(err);
            process.exit(1);
        }

        console.log(JSON.stringify(config));
        process.exit(0);
    }

    logError(err) {
        const logErr = this.logger ? this.logger.error.bind(this.logger) : console.error;
        if (err.message) {
            logErr(err.message);
        } else {
            logErr(err);
        }

        if (err.stack) {
            logErr(err.stack);
        }
    }

    async generatePort() {
        if (this.slicerPort) return;

        const slicerPortRange = _.get(this.context, 'sysconfig.teraslice.slicer_port_range');
        const dataArray = _.split(slicerPortRange, ':');
        const min = _.toInteger(dataArray[0]);
        const max = _.toInteger(dataArray[1]);

        const port = await porty.find({
            min,
            max,
        });

        this.slicerPort = port;
    }

    _parseArgs() {
        const { argv } = yargs.usage(
            '$0 [options] <jobFile>',
            'Development tool for creating a standalone execution context from a job.',
            (_yargs) => {
                _yargs.positional('jobFile', {
                    describe: 'Teraslice job file in json format.',
                    demandOption: true,
                    coerce: (arg) => {
                        const file = path.resolve(arg);
                        try {
                            return fs.readJsonSync(file);
                        } catch (err) {
                            throw new Error('Unable to read job file');
                        }
                    },
                });
            }
        ).scriptName('job-to-execution-context')
            .version()
            .alias('v', 'version')
            .help()
            .alias('h', 'help')
            .option('c', {
                alias: 'configfile',
                describe: `Terafoundation configuration file to load.
                Defaults to env TERAFOUNDATION_CONFIG.`,
                coerce: (arg) => {
                    if (!arg) return '';
                    return path.resolve(arg);
                },
            })
            .option('s', {
                alias: 'slicerPort',
                describe: 'Slicer port to use, otherwise generate one.',
                coerce: (arg) => {
                    if (!arg) return '';
                    return path.resolve(arg);
                },
            })
            .wrap(yargs.terminalWidth());

        return argv;
    }
}

const cmd = new Command();
cmd.run();
