import { BatchProcessor } from '@terascope/job-components';
import { TSError } from '@terascope/utils';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ScriptConfig } from './interfaces.js';

export default class Scripts extends BatchProcessor<ScriptConfig> {
    command!: string;

    async initialize(): Promise<void> {
        if (this.opConfig.asset === undefined || this.opConfig.asset === '' || this.opConfig.asset === 'echo') {
            // this would be used when a path is defined to the asset in the job
            this.command = this.opConfig.command;
        } else {
            const assetPath = await this.context.apis.assets.getPath(this.opConfig.asset);
            this.command = path.join(assetPath, this.opConfig.command);
        }
    }

    async onBatch(data: any[]): Promise<any> {
        const { args, options } = this.opConfig;

        return new Promise(((resolve, reject) => {
            let inData = '';
            try {
                inData = JSON.stringify(data);
            } catch (err) {
                reject(new TSError(err, {
                    reason: 'failed to convert input data to string',
                }));
                return;
            }

            let outErrors = '';
            let outData = '';
            let childProcess;

            try {
                childProcess = spawn(this.command, args, options);
            } catch (err) {
                reject(new TSError(err, {
                    reason: 'when trying to run command'
                }));
                return;
            }
            // @ts-expect-error TODO: check this
            childProcess.stdin.setEncoding('utf-8');
            childProcess.stdin.write(`${inData}\n`);
            childProcess.stdin.end();

            childProcess.on('error', (err) => {
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
                    } catch (err) {
                        reject(new TSError(err, {
                            reason: 'processing script stdout pipe'
                        }));
                    }
                }
            });

            childProcess.stderr.on('data', (outError) => {
                outErrors += outError;
            });

            childProcess.on('close', (code) => {
                if (code === 0) return;
                reject(new Error('child process non-zero exit'));
            });

            childProcess.on('error', (err) => {
                reject(err);
            });
        }));
    }
}
