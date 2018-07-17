'use strict';

const { spawn } = require('child_process');
const path = require('path');

const Promise = require('bluebird');

function newProcessor(context, opConfig) {
    const { args, options } = opConfig;
    const contextLogger = context.logger;

    let command = '';

    return new Promise(((resolve, reject) => {
        if (opConfig.asset === undefined || opConfig.asset === '' || opConfig.asset === 'echo') {
            // this would be used when a path is defined to the asset in the job
            ({ command } = opConfig);
            resolve(procData);
        } else {
            context.apis.assets.getPath(opConfig.asset)
                .then((apath) => {
                    command = path.join(apath, opConfig.command);
                    resolve(procData);
                })
                .catch((error) => {
                    const errorMsg = 'asset not in specified path';
                    contextLogger.error(errorMsg, error);
                    reject(errorMsg);
                });
        }
    }));

    function procData(data, logger) {
        return new Promise(((resolve, reject) => {
            let inData = '';
            try {
                inData = JSON.stringify(data);
            } catch (error) {
                const errorMsg = 'failed to convert input data to string';
                logger.error(errorMsg, error);
                reject(errorMsg);
            }

            let outErrors = '';
            let outData = '';
            let childProcess;

            try {
                childProcess = spawn(command, args, options);
            } catch (error) {
                const errorMsg = 'when trying to run command';
                logger.error(errorMsg, error);
                reject(errorMsg);
            }
            childProcess.stdin.setEncoding('utf-8');
            childProcess.stdin.write(`${inData}\n`);
            childProcess.stdin.end();

            childProcess.on('error', (err) => {
                logger.error(err);
                reject(err);
            });

            childProcess.stdout.on('data', (outDataItem) => {
                outData += outDataItem;
            });


            childProcess.stdout.on('end', () => {
                if (outErrors) {
                    reject(outErrors);
                } else {
                    try {
                        const final = JSON.parse(outData);
                        resolve(final);
                    } catch (error) {
                        const errorMsg = 'processing script stdout pipe';
                        logger.error(errorMsg, error);
                        reject(errorMsg);
                    }
                }
            });

            childProcess.stderr.on('data', (outError) => {
                outErrors += outError;
            });
            childProcess.on('close', (code) => {
                if (code > 1) {
                    const errorMsg = 'child process non-zero exit';
                    logger.error(errorMsg);
                    reject(errorMsg);
                }
            });

            childProcess.on('error', (err) => {
                logger.error(err);
                reject(err);
            });
        }));
    }
}

function schema() {
    return {
        command: {
            doc: 'what command to run',
            default: 'echo',
            format: 'required_String'
        },
        args: {
            doc: 'arguments to pass along with the command',
            default: [],
            format(val) {
                if (!Array.isArray(val)) {
                    throw new Error('args for script must be an array');
                }
            }
        },
        options: {
            doc: 'Obj containing options to pass into the process env',
            default: {}
        },
        asset: {
            doc: 'name of asset to use for op',
            default: 'echo',
            format: 'optional_String'
        }
    };
}

module.exports = {
    newProcessor,
    schema
};
