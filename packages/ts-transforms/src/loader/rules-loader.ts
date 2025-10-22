import fs from 'node:fs';
import readline from 'node:readline';
import { Readable } from 'node:stream';
import { Logger } from '@terascope/core-utils';
import { WatcherConfig, OperationConfigInput } from '../interfaces.js';

export default class RulesLoader {
    private opConfig: WatcherConfig;
    constructor(opConfig: WatcherConfig, _logger?: Logger) {
        this.opConfig = opConfig;
    }

    public async load(): Promise<OperationConfigInput[]> {
        const { notification_rules: notificationRules, rules } = this.opConfig;

        if (notificationRules) {
            return this.notificationLoader(notificationRules);
        }

        if (rules) {
            const results = await Promise.all<OperationConfigInput[]>(
                rules.map((ruleFile) => this.fileLoader(ruleFile))
            );
            return ([] as OperationConfigInput[]).concat(...results);
        }

        throw new Error('Rules or notifications must be provided');
    }

    private parseConfig(strConfig: string): OperationConfigInput {
        if (strConfig.charAt(0) !== '{') {
            return { selector: strConfig };
        }
        return JSON.parse(strConfig);
    }

    private async fileLoader(ruleFile: string): Promise<OperationConfigInput[]> {
        const inputStream = fs.createReadStream(ruleFile);
        return this.dataLoader(inputStream);
    }

    private async notificationLoader(notifications: string): Promise<OperationConfigInput[]> {
        const notificationsRules = [notifications];

        const inputStream = new Readable({
            read() {
                const rule = notificationsRules.pop();
                if (!rule) {
                    this.push(null);
                    return;
                }
                this.push(rule);
            },
        });
        return this.dataLoader(inputStream);
    }

    private async dataLoader(inputStream: Readable): Promise<OperationConfigInput[]> {
        const results: OperationConfigInput[] = [];
        const errorResults: string[] = [];
        let hasError = false;

        const rl = readline.createInterface({
            input: inputStream,
            crlfDelay: Infinity
        });

        return new Promise<OperationConfigInput[]>((resolve, reject) => {
            rl.on('line', (str) => {
                if (str) {
                    const configStr = str.trim();
                    const isComment = configStr[0] === '#';
                    if (!isComment && configStr.length > 0) {
                        try {
                            results.push(this.parseConfig(configStr));
                        } catch (err) {
                            const errMsg = err.message;
                            hasError = true;
                            errorResults.push(errMsg, ' => ', configStr, '\n');
                        }
                    }
                }
            });

            rl.on('close', () => {
                if (hasError) {
                    const errors = errorResults.join('');
                    const err = new Error(`could not load and parse the following configs: \n ${errors}`);
                    err.stack = undefined;
                    return reject(err);
                }
                resolve(results);
            });
        });
    }
}
